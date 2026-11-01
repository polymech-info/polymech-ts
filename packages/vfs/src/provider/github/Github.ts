/**
 * Experimental leg work of a Github - VFS adapter being used by some projects.
 */
import * as GitHubApi from 'github';
import { mixin, clone } from '@xblox/core/objects';
import { Path } from '../../model/Path';
import { FileResource } from '../../interfaces/Resource';
import { IObjectLiteral } from '../../interfaces/index';
import { Auth, ReposUpdateFileParams } from 'github';
import * as pathUtil from 'path';
import { encode } from '../../io/base64'; // gitdata.updateFile
import { INode } from '../../interfaces/VFS';
import { create as matcher } from '../../fs/utils/matcher';
import { IDeleteOptions } from '../../fs/interfaces';

// Most used Github API parameter
export interface IDefaultParameters {
	readonly repo: string;
	readonly owner: string;
	readonly branch: string;
}
/**
 * Enumeration for getTree item types. Defined by Github
 * @link https://developer.github.com/v3/git/trees/
 * @export
 * @enum {string}
 */
export enum ETreeBlobNodeType {
	BLOB = <any>'blob',
	TREE = <any>'tree',
	COMMIT = <any>'commit'
}
/**
 * Internal data structure for #getTree
 * @link https://developer.github.com/v3/git/trees/
 *
 * @export
 * @interface ITreeBlobNode
 */
export interface ITreeBlobNode {
	/**
	 * The file referenced in the tree.
	 *
	 * @type {string}
	 * @memberOf ITreeBlobNode
	 */
	path: string;
	/**
	 * The file mode; one of 100644 for file (blob), 100755 for executable (blob
	 * 040000 for subdirectory (tree), 160000 for submodule (commit), or 120000
	 * for a blob that specifies the path of a symlink.
	 *
	 * @type {string}
	 * @memberOf ITreeBlobNode
	 */
	mode: string;
	/**
	 * Either blob, tree, or commit
	 *
	 * @type {ETreeBlobNodeType}
	 * @memberOf ITreeBlobNode
	 */
	type: ETreeBlobNodeType;
	/**
	 *
	 *
	 * @type {number}
	 * @memberOf ITreeBlobNode
	 */
	size: number;
	/**
	 * The SHA1 checksum ID of the object in the tree
	 *
	 * @type {string}
	 * @memberOf ITreeBlobNode
	 */
	sha: string;
	url: string;
}
/**
 * Class to retrieve a tree per user, owner and repo - name.
 * This will fetch the required parent SHA automatically first.
 * @link https://developer.github.com/v3/git/trees/
 *
 * @export
 * @class Tree
 */
export class Tree {
	/**
	 * The API client object
	 *
	 * @private
	 * @type {GitHubApi}
	 * @memberOf Tree
	 */
	private readonly client: GitHubApi;

	/**
	 * Last retrieved SHA
	 *
	 * @type {string}
	 * @memberOf Tree
	 */
	private _sha: string;

	/**
	 * Last retrieved tree
	 *
	 * @private
	 * @type {ITreeBlobNode[]}
	 * @memberOf Tree
	 */
	private _tree: ITreeBlobNode[];

	/**
	 * Initial options
	 *
	 * @private
	 * @type {IDefaultParameters}
	 * @memberOf Tree
	 */
	private options: IDefaultParameters;

	constructor(client: GitHubApi, options: IDefaultParameters) {
		this.client = client;
		this.options = options;
	}

	/**
	 * Before doing anything, we need the tree's SHA.
	 *
	 * @param {boolean} [allowCached=true]
	 * @returns {Promise<string>}
	 *
	 * @memberOf Tree
	 */
	public async init(allowCached: boolean = true): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			if (this._sha && allowCached) {
				return resolve(this._sha);
			}
			this.client.repos.getBranch(this.options, (e, res) => {
				if (e) {
					return reject(e);
				}
				this._sha = res.data.commit.sha;
				resolve(this._sha);
			});
		});
	}

	//
	// ─── DELETE ─────────────────────────────────────────────────────────────────────
	//
	parseDeleteOptions(options: any | null, path: string): IDeleteOptions {
		const opts: IDeleteOptions = options || {} as IDeleteOptions;
		const parsedOptions: IDeleteOptions = {};
		parsedOptions.progress = opts.progress;
		parsedOptions.conflictCallback = opts.conflictCallback;
		parsedOptions.conflictSettings = opts.conflictSettings;
		parsedOptions.debug = opts.debug;
		parsedOptions.trash = opts.trash;
		parsedOptions.matching = opts.matching;
		if (!opts.filter) {
			if (opts.matching) {
				parsedOptions.filter = matcher(path, opts.matching);
			} else {
				parsedOptions.filter = () => { return true; };
			}
		}
		return parsedOptions;
	}

	/**
	 * Implement IVFS#delete
	 *
	 * @param {string} path
	 * @param {string} [message="remove file"]
	 * @returns {Promise<any[]>}
	 *
	 * @memberOf Tree
	 */
	public async rm(path: string, message: string = "remove file", options?: IDeleteOptions): Promise<any[]> {
		options = options || this.parseDeleteOptions(options, path);
		return new Promise<any[]>((resolve, reject) => {
			this.init().then((sha: string) => {
				this.info(path, false).then((node) => {
					let current = 0;
					let total = 1;
					// file
					if (node.type === ETreeBlobNodeType.BLOB) {
						let deleteArgs = this.extend({ path: path, message: message, sha: node.sha });
						return this.client.repos.deleteFile(deleteArgs).then((res) => {
							resolve([res]);
						});
					}
					// folder, since a delete operation will alter the whole SHA on the tree,
					// we have to then delete each node on by re-querying the tree's SHA subsequently
					if (node.type === ETreeBlobNodeType.TREE) {
						const ret: any[] = [];
						const proceed = (nodes: ITreeBlobNode[]) => {
							if (!nodes.length) {
								resolve(ret);
								return;
							}
							const next = nodes[0];
							current++;
							if (options.progress) {
								options.progress(node.path, current, total, VFS.mapNode(next as ITreeBlobNode));
							}
							if (next.type === ETreeBlobNodeType.TREE) {
								nodes.shift();
							}
							this.rm(next.path, message).then((res) => {
								nodes.shift();
								ret.push(...res);
								proceed(nodes);
							}).catch((e) => {
								proceed(nodes);
							});
						};
						this.children(path, true).then((nodes: ITreeBlobNode[]) => {
							total = nodes.length;
							proceed(nodes);
						});
					}
				});
			});
		});
	}

	public async info(path: string, allowCached: boolean = false): Promise<ITreeBlobNode> {
		return new Promise<ITreeBlobNode>((resolve, reject) => {
			this.ls(true, allowCached).then((nodes) => {
				const node = nodes.find((value, index, object) => {
					return value.path === path;
				});
				if (node) {
					resolve(node);
				} else {
					reject('Cant find node for ' + path);
				}
			}).catch(reject);
		});
	}

	public async children(path: string, allowCached: boolean = false): Promise<ITreeBlobNode[]> {
		return new Promise<ITreeBlobNode[]>((resolve, reject) => {
			this.ls(true, allowCached).then((nodes) => {
				const node = nodes.find((value, index, object) => {
					return value.path === path;
				});
				if (node) {
					const paths = nodes.map((node) => {
						return node.path;
					});
					const ret = new Path(node.path).getChildren(paths, true).map((childPath: string) => {
						return nodes.find((value, index, object) => {
							return value.path === childPath;
						});
					});
					resolve(ret);
				} else {
					reject('Cant find node for ' + path);
				}
			});
		});
	}

	public childrenSync(path: string, nodes: ITreeBlobNode[]): ITreeBlobNode[] {
		const paths = nodes.map((node) => {
			return node.path;
		});
		const ret = new Path(path).getChildren(paths, true).map((childPath: string) => {
			return nodes.find((value, index, object) => {
				return value.path === childPath;
			});
		});
		return ret;
	}

	public async ls(recursive: boolean = true, allowCached: boolean = false): Promise<ITreeBlobNode[]> {
		return new Promise<ITreeBlobNode[]>((resolve, reject) => {
			if (this._tree && allowCached) {
				return resolve(this._tree);
			}
			this.init(allowCached).then((sha: string) => {
				this.client.gitdata.getTree(this.extend({
					sha: this._sha,
					recursive: recursive
				}), (e, res) => {
					if (e) {
						return reject(e);
					}
					const tree: ITreeBlobNode[] = res.data.tree;
					this._tree = tree;
					resolve(tree);
				});
			});
		});
	}

	//
	// ─── UTILS ──────────────────────────────────────────────────────────────────────
	//

	/**
	 * Most of the time, Github wants some basic parameters together with some API specific
	 * parameters like path. This function will clone the base options and then merges the
	 * extras.
	 *
	 * @param {*} args
	 * @returns {*}
	 *
	 * @memberOf Tree
	 */
	public extend(args: any): any {
		return mixin(clone(this.options), args);
	}
}

export interface IClientOptions {
	debug?: boolean;
	protocol?: string;
	headers?: IObjectLiteral;
	followRedirects?: boolean;
	timeout?: number;
}

export interface IAuthOptions {
	type: string;
	token: string;
}
/**
 * Extend the core's File Resource type for Github constraints
 */
export type GithubResource = FileResource & {
	client?: IClientOptions;
	auth?: Auth;
	options: IDefaultParameters;
};

export class VFS {
	readonly resource: GithubResource;
	protected client: GitHubApi;

	// initial options
	readonly options: IDefaultParameters;

	constructor(resource: GithubResource) {
		this.resource = resource;
		this.options = resource.options;
		this.init();
	}
	public extend(args: any): any {
		return mixin(clone(this.options), args);
	}

	/**
	 * Map internal node rep. to public INode
	 *
	 * @param {ITreeBlobNode} node
	 * @param {string} mount
	 * @param {IObjectLiteral} options
	 * @returns {INode}
	 *
	 * @memberOf VFS
	 */
	public static mapNode(node: ITreeBlobNode, mount?: string, options?: IObjectLiteral): INode {
		const directory = node.type === ETreeBlobNodeType.TREE;
		const parent = new Path(node.path, false, false).getParentPath();
		return {
			path: './' + node.path,
			sizeBytes: node.size,
			size: node.size,
			owner: {
				user: null,
				group: null
			},
			isDir: directory,
			directory: directory,
			mime: !directory ? 'file' : 'folder',
			name: pathUtil.win32.basename(node.path),
			fileType: directory ? 'folder' : 'file',
			mount: mount,
			parent: "./" + parent.toString(),
			type: ''
		} as INode;
	}

	public async get(path: string, options?: IObjectLiteral): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			let getContentParams = this.extend({ path: path, ref: this.options.branch });
			this.client.repos.getContent(getContentParams, (err, res) => {
				if (err) {
					reject(err);
				}
				resolve(res.data);
			});
		});
	}

	/**
	 * Impl. IVFS#set. This will update the file content.
	 *
	 * @TODOs
	 * - This will fetch the file's info by retrieving the whole tree for getting
	 *   the required SHA
	 *
	 * @param {string} path
	 * @param {(String | Buffer)} content
	 * @param {IObjectLiteral} [options]
	 * @returns {Promise<string>}
	 *
	 * @memberOf VFS
	 */
	public async set(path: string, content: String | Buffer, options?: IObjectLiteral): Promise<string> {
		return new Promise<string>((resolve, reject) => {
			const tree = new Tree(this.client, this.resource.options);
			// split and strip slashes
			path = new Path(path, false, false).toString();
			tree.info(new Path(path, false, false).toString(), false).then((node) => {
				options = options || {};
				let params = options as ReposUpdateFileParams;
				params.message = options['message'] || "no message";
				params.content = encode(content as string);
				params.sha = node.sha;
				params.path = path;
				let setContentParams: ReposUpdateFileParams = mixin(this.extend({ path: path, ref: this.options.branch }), params);
				this.client.repos.updateFile(setContentParams, (err, res) => {
					if (err) {
						reject(err);
					}
					resolve(res);
				});
			});
		});
	}

	public async ls(path: string, mount: string, options: IObjectLiteral): Promise<INode[]> {
		return new Promise<INode[]>((resolve, reject) => {
			const tree = new Tree(this.client, this.resource.options);
			tree.ls(false).then((nodes) => {
				const ret: INode[] = nodes.map((node) => {
					const newNode = VFS.mapNode(node, mount, options);
					// for directories, we add all child nodes
					if (newNode.directory) {
						const children = tree.childrenSync(newNode.path, nodes);
						if (children && children.length) {
							newNode.children = children.map((child) => {
								return VFS.mapNode(child, mount, options);
							});
							newNode._EX = true;
						}
					}
					return newNode;
				});
				resolve(ret);
			});
		});
	}
	init() {
		this.client = new GitHubApi(this.resource.client || {
			// optional
			debug: false,
			protocol: "https",
			host: "api.github.com", // should be  for GitHub
			// pathPrefix: "/api/v3", // for some GHEs; none for GitHub
			headers: {
				"user-agent": "My-Cool-GitHub-App", // GitHub is happy with a unique user agent
				"Accept": "application/vnd.github.v3.raw"
			},
			followRedirects: true, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
			timeout: 5000
		});

		if (this.resource.auth) {
			this.client.authenticate(this.resource.auth);
		}
	}
}

export function test() {
	let token = "5b86c11984717f8146756593644abe60785b5f";
	token += '1f';

	const owner = 'xblox';
	const repo = 'xide';
	const branch = 've';
	const tFile = 'mixins';
	try {
		let github = new GitHubApi({
			// optional
			debug: false,
			protocol: "https",
			host: "api.github.com", // should be  for GitHub
			// pathPrefix: "/api/v3", // for some GHEs; none for GitHub
			headers: {
				"user-agent": "My-Cool-GitHub-App", // GitHub is happy with a unique user agent
				"Accept": "application/vnd.github.v3.raw"
			},
			followRedirects: true, // default: true; there's currently an issue with non-get redirects, so allow ability to disable follow-redirects
			timeout: 5000

		});
		github.authenticate({
			type: "oauth",
			token: token
		});
		let t = new Tree(github, { owner: owner, repo: repo, branch: branch });
		t.rm(tFile).then((res) => {
			console.log('removed file ', res);
		});
	} catch (e) {
		console.error('e', e);
	}
}
