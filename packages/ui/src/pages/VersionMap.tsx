import { useState, useEffect, useCallback, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { ReactFlow, Node, Edge, Background, Controls, MiniMap, useNodesState, useEdgesState, NodeProps, EdgeProps, getBezierPath, BaseEdge, EdgeLabelRenderer, Handle, Position, Connection } from "@xyflow/react";
import { fetchPictureById, deletePictures, deletePicture, updatePicture } from "@/modules/posts/client-pictures";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Wand2, Trash2, Edit3, Check, Unlink, Star } from "lucide-react";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

import "@xyflow/react/dist/style.css";

const ENABLE_GRAPH_DEBUG = false;

interface Picture {
  id: string;
  title: string;
  description: string | null;
  image_url: string;
  created_at: string;
  user_id: string;
  parent_id: string | null;
  is_selected: boolean;
}

interface VersionNodeData {
  id: string;
  image_url: string;
  title: string;
  created_at: string;
  isGenerated: boolean;
  isCurrent: boolean;
  isSelected: boolean;
  onDelete?: (id: string, e: React.MouseEvent) => void;
  onEdit?: (id: string, e: React.MouseEvent) => void;
  onDetach?: (id: string, e: React.MouseEvent) => void;
  onToggleSelect?: (id: string, e: React.MouseEvent) => void;
}

// Custom pipe edge component
function PipeEdge(props: EdgeProps) {
  const { id, sourceX, sourceY, targetX, targetY, sourcePosition, targetPosition } = props;

  const [edgePath] = getBezierPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
  });

  return (
    <>
      {/* Base pipe (thickest, darkest) */}
      <BaseEdge
        id={id}
        path={edgePath}
        style={{
          stroke: '#475569',
          strokeWidth: 12,
          strokeLinecap: 'round',
        }}
      />
      {/* Middle pipe layer */}
      <BaseEdge
        id={`${id}-middle`}
        path={edgePath}
        style={{
          stroke: '#64748b',
          strokeWidth: 8,
          strokeLinecap: 'round',
        }}
      />
      {/* Top pipe highlight */}
      <BaseEdge
        id={`${id}-highlight`}
        path={edgePath}
        style={{
          stroke: '#94a3b8',
          strokeWidth: 4,
          strokeLinecap: 'round',
        }}
      />
    </>
  );
}

// Custom node component for version thumbnails
function VersionNode({ data }: { data: VersionNodeData }) {
  const navigate = useNavigate();

  const handleWizardClick = (e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent navigation to post

    // Store the image data in sessionStorage for the wizard using the same format as MagicWizardButton
    // The current image should be the parent of any new versions created
    const imageData = {
      id: data.id,
      src: data.image_url,
      title: data.title,
      selected: true,
      isGenerated: false,
      realDatabaseId: data.id, // The current image ID - this will be the parent
      parentForNewVersions: data.id // Explicitly set this image as parent for new versions
    };

    if (ENABLE_GRAPH_DEBUG) console.log('🔧 [VersionMap] Storing image data for wizard (current image as parent):', imageData);
    sessionStorage.setItem('wizardInitialImage', JSON.stringify(imageData));

    // Navigate to wizard
    navigate('/wizard');
  };

  return (
    <div className="relative group">
      {/* React Flow Handles for connections */}
      {/* Every node needs a target handle (except root) */}
      <Handle
        type="target"
        position={Position.Top}
        id="top"
        style={{ background: '#64748b', width: 8, height: 8 }}
      />

      {/* Every node needs a source handle for potential children */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="bottom"
        style={{
          background: '#64748b',
          width: 8,
          height: 8,
          left: '25%' // Position pipe handle to the left
        }}
      />

      {/* Wizard Handle - Bottom side */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="wizard"
        style={{
          background: '#8b5cf6',
          width: 12,
          height: 12,
          borderRadius: '50%',
          border: '2px solid white',
          left: '75%', // Position it to the right of center
          zIndex: 10,
          bottom: '-8px' // Move it further out to avoid clipping
        }}
        onClick={handleWizardClick}
      />

      {/* Pipe connectors - visual only */}
      {data.isGenerated && (
        <div className="absolute -top-3 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-slate-600 rounded-full border-2 border-slate-400 shadow-md"></div>
      )}
      {!data.isGenerated && (
        <div className="absolute -bottom-3 left-1/2 transform -translate-x-1/2 w-5 h-5 bg-slate-600 rounded-full border-2 border-slate-400 shadow-md"></div>
      )}

      {/* Action buttons - appear on hover */}
      <div className="absolute top-1 left-1 opacity-0 group-hover:opacity-100 transition-opacity z-20 flex gap-1">
        <Button
          size="sm"
          onClick={(e) => data.onEdit?.(data.id, e)}
          className="w-5 h-5 p-0 bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg"
          title="Edit version"
        >
          <Edit3 className="w-2.5 h-2.5 text-white" />
        </Button>
        <Button
          size="sm"
          onClick={(e) => data.onToggleSelect?.(data.id, e)}
          className={`w-5 h-5 p-0 rounded-full shadow-lg ${data.isSelected ? 'bg-primary hover:bg-primary/80' : 'bg-gray-600 hover:bg-gray-700'}`}
          title={data.isSelected ? 'Unselect version' : 'Select version'}
        >
          <Star className={`w-2.5 h-2.5 text-white ${data.isSelected ? 'fill-white' : ''}`} />
        </Button>
        <Button
          size="sm"
          onClick={(e) => data.onDelete?.(data.id, e)}
          className={`w-5 h-5 p-0 rounded-full shadow-lg ${data.isSelected ? 'bg-red-400 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700'}`}
          title={data.isSelected ? 'Unselect before deleting' : 'Delete version'}
          disabled={data.isSelected}
        >
          <Trash2 className="w-2.5 h-2.5 text-white" />
        </Button>
        {data.isGenerated && (
          <Button
            size="sm"
            onClick={(e) => data.onDetach?.(data.id, e)}
            className="w-5 h-5 p-0 bg-yellow-600 hover:bg-yellow-700 rounded-full shadow-lg"
            title="Detach from parent (make root)"
          >
            <Unlink className="w-2.5 h-2.5 text-white" />
          </Button>
        )}
      </div>

      {/* Wizard button - appears on hover */}
      <div className="absolute -bottom-3 right-1 opacity-0 group-hover:opacity-100 transition-opacity z-20">
        <Button
          size="sm"
          onClick={handleWizardClick}
          className="w-6 h-6 p-0 bg-primary hover:bg-primary/80 rounded-full shadow-lg"
          title="Open AI Wizard with this image"
        >
          <Wand2 className="w-3 h-3 text-white" />
        </Button>
      </div>

      <div
        className={`bg-card border-2 ${data.isSelected ? 'border-primary ring-2 ring-primary/20' : 'border-border'} rounded-lg p-2 cursor-pointer hover:border-primary transition-colors shadow-lg relative`}
        onClick={() => navigate(`/post/${data.id}`)}
        style={{ width: 120, height: 120 }}
      >
        {data.isCurrent && (
          <div className="absolute top-1 right-1 bg-green-600 text-white text-[10px] px-1 py-0.5 rounded font-medium leading-none z-10 shadow-sm">
            Current
          </div>
        )}

        {/* Selected indicator - top left corner */}
        {data.isSelected && (
          <div className="absolute top-1 left-1 bg-primary text-primary-foreground text-[10px] px-1 py-0.5 rounded font-medium leading-none flex items-center z-10 shadow-sm">
            <Check className="w-2.5 h-2.5 mr-0.5" />
            Selected
          </div>
        )}

        <img
          src={data.image_url}
          alt={data.title}
          className="w-full h-16 object-cover rounded mb-1"
        />
        <div className="text-xs font-medium truncate">{data.title}</div>
        <div className="text-xs text-muted-foreground flex items-center justify-between">
          <span className="text-[10px] opacity-70">
            {new Date(data.created_at).toLocaleDateString('en-US', {
              month: 'numeric',
              day: 'numeric'
            })}
          </span>
          <Wand2 className="w-3 h-3 text-muted-foreground opacity-50 group-hover:opacity-100 transition-opacity" />
        </div>
      </div>
    </div>
  );
}

const nodeTypes = {
  version: VersionNode,
};

const VersionMap = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [versions, setVersions] = useState<Picture[]>([]);
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [allUserPictures, setAllUserPictures] = useState<Picture[]>([]);
  const versionsRef = useRef<Picture[]>([]);
  const allUserPicsRef = useRef<Picture[]>([]);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [versionToDelete, setVersionToDelete] = useState<Picture | null>(null);
  const [descendantsToDelete, setDescendantsToDelete] = useState<Picture[]>([]);

  useEffect(() => {
    if (id) {
      fetchVersions();
    }
  }, [id]);

  const fetchVersions = async () => {
    if (!id) {
      if (ENABLE_GRAPH_DEBUG) console.log('🔧 [VersionMap] No ID provided');
      return;
    }

    if (ENABLE_GRAPH_DEBUG) console.log('🔧 [VersionMap] Fetching versions for ID:', id);

    try {
      // First get the current picture to determine the parent
      const currentPicture = await fetchPictureById(id);

      if (!currentPicture) throw new Error('Picture not found');

      if (ENABLE_GRAPH_DEBUG) console.log('🔧 [VersionMap] Current picture:', currentPicture);

      // Use the /api/pictures/versions endpoint which does deep collectVersionTree on the server
      const params = new URLSearchParams({ rootId: id });
      if (currentPicture.user_id) params.append('ownerId', currentPicture.user_id);
      if (currentPicture.user_id) params.append('userId', currentPicture.user_id);
      const res = await fetch(`/api/pictures/versions?${params}`);
      if (!res.ok) throw new Error(`Failed to fetch versions: ${res.statusText}`);
      const versionsData: Picture[] = await res.json();

      if (ENABLE_GRAPH_DEBUG) console.log('🔧 [VersionMap] Version tree found:', versionsData.length, 'versions');

      setVersions(versionsData || []);
      versionsRef.current = versionsData || [];
      setAllUserPictures(versionsData || []);
      allUserPicsRef.current = versionsData || [];
      createNodesAndEdges(versionsData || [], id);
    } catch (error) {
      console.error('🔧 [VersionMap] Error fetching versions:', error);
      toast.error('Failed to load version map');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteVersion = (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();

    // Use refs to avoid stale closure (state hasn't re-rendered when createNodesAndEdges runs)
    const version = versionsRef.current.find(v => v.id === versionId);
    if (!version) return;

    // Find direct children that will be re-parented
    const children = allUserPicsRef.current.filter(p => p.parent_id === versionId);

    setVersionToDelete(version);
    setDescendantsToDelete(children);
    setShowDeleteDialog(true);
  };

  const confirmDelete = async () => {
    if (!versionToDelete) return;

    try {
      // Delete only this picture — server re-parents orphaned children to root
      await deletePicture(versionToDelete.id);

      toast.success('Version deleted' + (descendantsToDelete.length > 0
        ? ` — ${descendantsToDelete.length} child version${descendantsToDelete.length === 1 ? '' : 's'} re-linked to root`
        : ''));

      // If we deleted the current version, navigate back
      if (versionToDelete.id === id) {
        navigate('/');
      } else {
        fetchVersions();
      }

      setShowDeleteDialog(false);
      setVersionToDelete(null);
      setDescendantsToDelete([]);
    } catch (error) {
      console.error('Error deleting version:', error);
      toast.error('Failed to delete version');
    }
  };

  const handleEditVersion = (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/post/${versionId}`);
  };

  const handleReparent = useCallback(async (connection: Connection) => {
    const { source, target } = connection;
    if (!source || !target || source === target) return;

    // target is the node being re-parented, source is the new parent
    // (dragging FROM source handle TO target handle)
    const childId = target;
    const newParentId = source;

    // Cycle detection: ensure newParent is not a descendant of child
    const isDescendant = (parentId: string, checkId: string): boolean => {
      const children = allUserPictures.filter(p => p.parent_id === parentId);
      for (const c of children) {
        if (c.id === checkId) return true;
        if (isDescendant(c.id, checkId)) return true;
      }
      return false;
    };

    if (isDescendant(childId, newParentId)) {
      toast.error('Cannot re-parent: would create a cycle');
      return;
    }

    try {
      await updatePicture(childId, { parent_id: newParentId } as any);
      toast.success('Re-linked version successfully');
      fetchVersions();
    } catch (error) {
      console.error('Error re-parenting:', error);
      toast.error('Failed to re-link version');
    }
  }, [allUserPictures]);

  const handleDetach = useCallback(async (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await updatePicture(versionId, { parent_id: null } as any);
      toast.success('Detached version — now a root');
      fetchVersions();
    } catch (error) {
      console.error('Error detaching:', error);
      toast.error('Failed to detach version');
    }
  }, []);

  const handleToggleSelect = useCallback(async (versionId: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const pic = versionsRef.current.find(v => v.id === versionId);
    if (!pic) return;
    try {
      await updatePicture(versionId, { is_selected: !pic.is_selected } as any);
      toast.success(pic.is_selected ? 'Version unselected' : 'Version selected');
      fetchVersions();
    } catch (error) {
      console.error('Error toggling selection:', error);
      toast.error('Failed to toggle selection');
    }
  }, []);

  const createNodesAndEdges = (versionsData: Picture[], currentId: string) => {
    if (ENABLE_GRAPH_DEBUG) console.log('🔧 [VersionMap] createNodesAndEdges called with:', {
      versionsCount: versionsData.length,
      currentId,
      versionsData
    });

    const nodes: Node[] = [];
    const edges: Edge[] = [];

    if (versionsData.length === 0) {
      if (ENABLE_GRAPH_DEBUG) console.log('🔧 [VersionMap] No versions data - returning empty nodes/edges');
      setNodes([]);
      setEdges([]);
      return;
    }

    // Build a tree structure to handle multi-level hierarchies
    type EnrichedPicture = Picture & { children: EnrichedPicture[], level: number };

    const buildTree = (versions: Picture[]): {
      nodeMap: Map<string, EnrichedPicture>,
      roots: EnrichedPicture[]
    } => {
      if (ENABLE_GRAPH_DEBUG) console.log('🔧 [VersionMap] Building tree from versions:', versions);
      const nodeMap = new Map<string, EnrichedPicture>();

      // Initialize all nodes
      versions.forEach(version => {
        nodeMap.set(version.id, { ...version, children: [] as EnrichedPicture[], level: 0 });
      });

      if (ENABLE_GRAPH_DEBUG) console.log('🔧 [VersionMap] Initialized nodeMap with', nodeMap.size, 'nodes');

      // Build parent-child relationships and calculate levels
      const roots: EnrichedPicture[] = [];

      versions.forEach(version => {
        const node = nodeMap.get(version.id)!;

        if (version.parent_id) {
          const parent = nodeMap.get(version.parent_id);
          if (parent) {
            parent.children.push(node);
            node.level = parent.level + 1;
            if (ENABLE_GRAPH_DEBUG) console.log('🔧 [VersionMap] Added child', version.id, 'to parent', version.parent_id, 'at level', node.level);
          } else {
            if (ENABLE_GRAPH_DEBUG) console.log('🔧 [VersionMap] Parent not found for', version.id, 'parent_id:', version.parent_id);
          }
        } else {
          roots.push(node);
          if (ENABLE_GRAPH_DEBUG) console.log('🔧 [VersionMap] Added root node:', version.id);
        }
      });

      if (ENABLE_GRAPH_DEBUG) console.log('🔧 [VersionMap] Tree built - roots:', roots.length, 'total nodes:', nodeMap.size);
      return { nodeMap, roots };
    };

    const { nodeMap, roots } = buildTree(versionsData);

    // Position nodes using subtree-width-aware layout to prevent overlaps
    const NODE_W = 150;
    const NODE_H = 180;
    const NODE_GAP = 30;

    // First pass: calculate subtree widths
    const subtreeWidth = (node: EnrichedPicture): number => {
      if (node.children.length === 0) return NODE_W;
      const childrenWidth = node.children.reduce((sum, c) => sum + subtreeWidth(c), 0);
      return childrenWidth + (node.children.length - 1) * NODE_GAP;
    };

    // Second pass: position nodes using calculated widths
    const positionNode = (node: EnrichedPicture, x: number, y: number) => {
      // Place this node centered over its subtree
      nodes.push({
        id: node.id,
        type: 'version',
        position: { x, y },
        data: {
          ...node,
          isGenerated: !!node.parent_id,
          isCurrent: node.id === currentId,
          isSelected: node.is_selected,
          onDelete: handleDeleteVersion,
          onEdit: handleEditVersion,
          onDetach: handleDetach,
          onToggleSelect: handleToggleSelect,
        },
      });

      if (node.children.length > 0) {
        const totalChildrenWidth = node.children.reduce((sum, c) => sum + subtreeWidth(c), 0)
          + (node.children.length - 1) * NODE_GAP;
        let childX = x - totalChildrenWidth / 2;

        node.children.forEach((child) => {
          const childW = subtreeWidth(child);
          const childCenterX = childX + childW / 2;

          edges.push({
            id: `${node.id}-${child.id}`,
            source: node.id,
            sourceHandle: 'bottom',
            target: child.id,
            targetHandle: 'top',
            type: 'default',
            style: {
              stroke: '#475569',
              strokeWidth: 10,
              strokeLinecap: 'round',
              filter: 'drop-shadow(0 2px 4px rgba(0,0,0,0.2))'
            },
          });

          positionNode(child, childCenterX, y + NODE_H);
          childX += childW + NODE_GAP;
        });
      }
    };

    // Position root nodes
    let totalRootWidth = roots.reduce((sum, r) => sum + subtreeWidth(r), 0)
      + (roots.length - 1) * NODE_GAP;
    let rootX = -totalRootWidth / 2;

    roots.forEach((root) => {
      const w = subtreeWidth(root);
      const centerX = rootX + w / 2;
      positionNode(root, centerX, 0);
      rootX += w + NODE_GAP;
    });

    if (ENABLE_GRAPH_DEBUG) {
      console.log('🔧 [VersionMap] Final result - nodes:', nodes.length, 'edges:', edges.length);
      console.log('🔧 [VersionMap] Nodes:', nodes);
      console.log('🔧 [VersionMap] Edges:', edges);
    }

    setNodes(nodes);
    setEdges(edges);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background pt-8 flex items-center justify-center">
        <div className="text-muted-foreground">Loading version map...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pt-8">
      <div className="p-4">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => navigate(-1)}
          className="mb-4"
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back
        </Button>

        <h1 className="text-2xl font-bold mb-4">Version Map</h1>

        <div className="h-[80vh] border rounded-lg">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={handleReparent}
            nodeTypes={nodeTypes}
            deleteKeyCode={null}
            edgesFocusable={false}
            fitView
            fitViewOptions={{ padding: 0.2 }}
          >
            <Background />
            <Controls />
            <MiniMap />
          </ReactFlow>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Version</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{versionToDelete?.title}"?
              {descendantsToDelete.length > 0 && (
                <>
                  <br /><br />
                  {descendantsToDelete.length} child version{descendantsToDelete.length === 1 ? '' : 's'} will be re-linked to the tree root:
                  <ul className="mt-2 ml-4 list-disc">
                    {descendantsToDelete.map(d => (
                      <li key={d.id}>{d.title || 'Untitled'}</li>
                    ))}
                  </ul>
                </>
              )}
              <br /><br />
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete {versionToDelete && descendantsToDelete.length > 0 ? `${1 + descendantsToDelete.length} versions` : 'version'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VersionMap;
