class CKParameterLocal extends CKParameter {
  SetAsMyselfParameter(act: boolean): void;

  IsMyselfParameter(): boolean {
    return (this.m_ObjectFlags & CK_PARAMETERIN_THIS) !== 0;
  }

  SetOwner(o: CKObject): void;
  SetValue(buf: any, size?: number): CKERROR;
  CopyValue(param: CKParameter, UpdateParam?: boolean): CKERROR;

  GetWriteDataPtr(): any;
  SetStringValue(Value: string): CKERROR;

  CheckClass(iType: CKParameterTypeDesc): void;

  constructor(Context: CKContext, name?: string);
  destructor();

  GetClassID(): CK_CLASSID;

  PreDelete(): void;

  Save(file: CKFile, flags: number): CKStateChunk;
  Load(chunk: CKStateChunk, file: CKFile): CKERROR;

  GetMemoryOccupation(): number;

  RemapDependencies(context: CKDependenciesContext): CKERROR;
  Copy(o: CKObject, context: CKDependenciesContext): CKERROR;

  static GetClassName(): string;
  static GetDependenciesCount(mode: number): number;
  static GetDependencies(i: number, mode: number): string;
  static Register(): void;
  static CreateInstance(Context: CKContext): CKParameterLocal;
  static ReleaseInstance(iContext: CKContext, instance: CKParameterLocal): void;
  static m_ClassID: CK_CLASSID;

  static Cast(iO: CKObject): CKParameterLocal | null {
    return CKIsChildClassOf(iO, CKCID_PARAMETERLOCAL) ? (iO as CKParameterLocal) : null;
  }
}