const CKPLUGINMANAGER_H = "$Id:$";

const CKPLUGIN_BITMAP = "Bitmap Readers";
const CKPLUGIN_SOUND = "Sound Readers";
const CKPLUGIN_MODEL = "Model Readers";
const CKPLUGIN_MANAGER = "Managers";
const CKPLUGIN_BEHAVIOR = "BuildingBlocks";
const CKPLUGIN_RENDERENGINE = "Render Engines";
const CKPLUGIN_MOVIE = "Movie Readers";
const CKPLUGIN_EXTENSIONS = "Extensions";

interface CKRasterizerInfo {}

type CKRST_GETINFO = (info: CKRasterizerInfo) => void;

interface CKPluginDll {
    m_DllFileName: string;
    m_DllInstance: INSTANCE_HANDLE;
    m_PluginInfoCount: number;
    GetFunctionPtr(FunctionName: CKSTRING): void | null;
}

type CKReaderGetReaderFunction = (type: number) => CKDataReader;

interface CKPluginEntryReadersData {
    m_SettingsParameterGuid: CKGUID;
    m_OptionCount: number;
    m_ReaderFlags: CK_DATAREADER_FLAGS;
    m_GetReaderFct: CKReaderGetReaderFunction | null;
}

interface CKPluginEntryBehaviorsData {
    m_BehaviorsGUID: Array<CKGUID>;
}

interface CKPluginEntry {
    m_PluginDllIndex: number;
    m_PositionInDll: number;
    m_PluginInfo: CKPluginInfo;
    m_ReadersInfo: CKPluginEntryReadersData | null;
    m_BehaviorsInfo: CKPluginEntryBehaviorsData | null;
    m_Active: CKBOOL;
    m_IndexInCategory: number;
    m_NeededByFile: CKBOOL;
}

interface CKPluginCategory {
    m_Name: string;
    m_Entries: Array<CKPluginEntry>;
}

type CKPluginGetInfoCountFunction = () => number;

type CKPluginGetInfoFunction = (Index: number) => CKPluginInfo;

class CKPluginManager {
    constructor() {}
    ParsePlugins(Directory: CKSTRING): number { return 0; }
    RegisterPlugin(str: CKSTRING): CKERROR { return CKERROR.FAILURE; }
    FindComponent(Component: CKGUID, catIdx: number = -1): CKPluginEntry | null { return null; }

    AddCategory(cat: CKSTRING): number { return 0; }
    RemoveCategory(catIdx: number): CKERROR { return CKERROR.FAILURE; }
    GetCategoryCount(): number { return 0; }
    GetCategoryName(catIdx: number): CKSTRING { return ""; }
    GetCategoryIndex(cat: CKSTRING): number { return 0; }
    RenameCategory(catIdx: number, newName: CKSTRING): CKERROR { return CKERROR.FAILURE; }

    GetPluginDllCount(): number { return 0; }
    GetPluginDllInfo(PluginDllIdx: number): CKPluginDll | null { return null; }
    GetPluginDllInfo(PluginName: CKSTRING, idx?: number): CKPluginDll | null { return null; }
    UnLoadPluginDll(PluginDllIdx: number): CKERROR { return CKERROR.FAILURE; }
    ReLoadPluginDll(PluginDllIdx: number): CKERROR { return CKERROR.FAILURE; }

    GetPluginCount(catIdx: number): number { return 0; }
    GetPluginInfo(catIdx: number, PluginIdx: number): CKPluginEntry | null { return null; }

    SetReaderOptionData(context: CKContext, memdata: any, Param: CKParameterOut, ext: CKFileExtension, guid?: CKGUID): boolean { return false; }
    GetReaderOptionData(context: CKContext, memdata: any, ext: CKFileExtension, guid?: CKGUID): CKParameterOut | null { return null; }

    GetBitmapReader(ext: CKFileExtension, preferedGUID?: CKGUID): CKBitmapReader | null { return null; }
    GetSoundReader(ext: CKFileExtension, preferedGUID?: CKGUID): CKSoundReader | null { return null; }
    GetModelReader(ext: CKFileExtension, preferedGUID?: CKGUID): CKModelReader | null { return null; }
    GetMovieReader(ext: CKFileExtension, preferedGUID?: CKGUID): CKMovieReader | null { return null; }

    Load(context: CKContext, FileName: CKSTRING, liste: CKObjectArray, LoadFlags: CK_LOAD_FLAGS, carac?: CKCharacter, Readerguid?: CKGUID): CKERROR { return CKERROR.FAILURE; }
    Save(context: CKContext, FileName: CKSTRING, liste: CKObjectArray, SaveFlags: CKDWORD, Readerguid?: CKGUID): CKERROR { return CKERROR.FAILURE; }

    ReleaseAllPlugins(): void {}
    InitializePlugins(context: CKContext): void {}
    DeInitializePlugins(context: CKContext): void {}
    ComputeDependenciesList(file: CKFile): void {}
    MarkComponentAsNeeded(Component: CKGUID, catIdx: number): void {}
    
    AddPlugin(catIdx: number, Plugin: CKPluginEntry): number { return 0; }
    RemovePlugin(catIdx: number, PluginIdx: number): CKERROR { return CKERROR.FAILURE; }

    EXTFindEntry(ext: CKFileExtension, Category: number = -1): CKPluginEntry | null { return null; }
    EXTFindReader(ext: CKFileExtension, Category: number = -1): CKDataReader | null { return null; }
    GUIDFindReader(guid: CKGUID, Category: number = -1): CKDataReader | null { return null; }

    Clean(): void {}
    Init(): void {}
}