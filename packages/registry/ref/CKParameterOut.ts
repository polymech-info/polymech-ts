class CKParameterOut extends CKParameter {
    constructor(protected context: CKContext, name: string | null = null) {
        super();
    }

    CheckClass(iType: CKParameterTypeDesc): void {}

    GetValue(buf: any, update: boolean = true): CKERROR { return CKERROR.NONE; }

    SetValue(buf: any, size: number = 0): CKERROR { return CKERROR.NONE; }

    CopyValue(param: CKParameter, UpdateParam: boolean = true): CKERROR { return CKERROR.NONE; }

    GetReadDataPtr(update: boolean = true): any { return null; }

    GetStringValue(Value: CKSTRING, update: boolean = true): number { return 0; }

    DataChanged(): void {}

    AddDestination(param: CKParameter, CheckType = true): CKERROR { return CKERROR.NONE; }

    RemoveDestination(param: CKParameter): void {}

    GetDestinationCount(): number { return 0; }

    GetDestination(pos: number): CKParameter | null { return null; }

    RemoveAllDestinations(): void {}

    PreSave(file: CKFile, flags: CKDWORD): void {}

    Save(file: CKFile, flags: CKDWORD): CKStateChunk | null { return null; }

    Load(chunk: CKStateChunk, file: CKFile): CKERROR { return CKERROR.NONE; }

    PreDelete(): void {}

    CheckPreDeletion(): void {}

    GetMemoryOccupation(): number { return 0; }

    IsObjectUsed(o: CKObject, cid: CK_CLASSID): number { return 0; }

    RemapDependencies(context: CKDependenciesContext): CKERROR { return CKERROR.NONE; }

    Copy(o: CKObject, context: CKDependenciesContext): CKERROR { return CKERROR.NONE; }

    static GetClassName(): CKSTRING { return ""; }

    static GetDependenciesCount(mode: number): number { return 0; }

    static GetDependencies(i: number, mode: number): CKSTRING { return ""; }

    static Register(): void {}

    static CreateInstance(context: CKContext): CKParameterOut { return new CKParameterOut(context); }

    static ReleaseInstance(iContext: CKContext, instance: CKParameterOut): void {}

    static m_ClassID: CK_CLASSID = 0 as CK_CLASSID;

    static Cast(iO: CKObject): CKParameterOut | null {
        return CKIsChildClassOf(iO, CKCID_PARAMETEROUT) ? (iO as CKParameterOut) : null;
    }

    Update(): void {}

    protected m_Destinations: XSObjectPointerArray = new XSObjectPointerArray();
}