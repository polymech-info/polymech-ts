class CKParameterOperation extends CKObject {
    private m_In1: CKParameterIn;
    private m_In2: CKParameterIn;
    private m_Out: CKParameterOut;
    private m_Owner: CKBehavior;
    static m_In1Name: string;
    static m_In2Name: string;
    static m_OutName: string;
    static m_ClassID: CK_ID;

    constructor(context: CKContext, name: string = null, opGuid?: CKGUID, resGuid?: CKGUID, p1Guid?: CKGUID, p2Guid?: CKGUID) {
        super();
    }

    GetInParameter1(): CKParameterIn {
        return this.m_In1;
    }

    GetInParameter2(): CKParameterIn {
        return this.m_In2;
    }

    GetOutParameter(): CKParameterOut {
        return this.m_Out;
    }

    GetOwner(): CKBehavior {
        return this.m_Owner;
    }

    SetOwner(beh: CKBehavior) {
        this.m_Owner = beh;
    }

    DoOperation(): CKERROR {
        //
    }

    GetOperationGuid(): CKGUID {
        //
    }

    Reconstruct(name: string, opGuid: CKGUID, resGuid: CKGUID, p1Guid: CKGUID, p2Guid: CKGUID) {
        //
    }

    static Cast(iO: CKObject): CKParameterOperation {
        return CKIsChildClassOf(iO, CKCID_PARAMETEROPERATION) ? <CKParameterOperation>iO : null;
    }

    static GetClassName(): string {
        //
    }

    static GetDependenciesCount(mode: number): number {
        //
    }

    static GetDependencies(i: number, mode: number): string {
        //
    }

    static Register() {
        //
    }

    static CreateInstance(context: CKContext): CKParameterOperation {
        //
    }

    static ReleaseInstance(iContext: CKContext, instance: CKParameterOperation) {
        //
    }

    GetClassID(): CK_CLASSID {
        //
    }

    PreSave(file: CKFile, flags: number): void {
        //
    }

    Save(file: CKFile, flags: number): CKStateChunk {
        //
    }

    Load(chunk: CKStateChunk, file: CKFile): CKERROR {
        //
    }

    PostLoad(): void {
        //
    }

    PreDelete(): void {
        //
    }

    GetMemoryOccupation(): number {
        //
    }

    IsObjectUsed(o: CKObject, cid: CK_CLASSID): number {
        //
    }

    PrepareDependencies(context: CKDependenciesContext, iCaller: boolean = true): CKERROR {
        //
    }

    RemapDependencies(context: CKDependenciesContext): CKERROR {
        //
    }

    Copy(o: CKObject, context: CKDependenciesContext): CKERROR {
        //
    }
}