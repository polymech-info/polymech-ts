class CKParameterIn extends CKObject {
    constructor(Context: CKContext, name: string = null, type: number = null) {
        super();
        // initialization logic here
    }

    GetValue(buf: any): CKERROR {
        let p = this.GetRealSource();
        if (!p) return CKERR_NOTINITIALIZED;
        return p.GetValue(buf);
    }

    GetReadDataPtr(): any {
        let p = this.GetRealSource();
        if (!p) return null;
        return p.GetReadDataPtr();
    }

    GetSharedSource(): CKParameterIn {
        return (!(this.m_ObjectFlags & CK_PARAMETERIN_SHARED)) ? null : this.m_InShared;
    }

    GetRealSource(): CKParameter {
        if (this.m_ObjectFlags & CK_PARAMETERIN_SHARED) {
            if (this.m_InShared) return this.m_InShared.GetRealSource();
        } else {
            return this.m_OutSource;
        }
        return null;
    }

    GetDirectSource(): CKParameter {
        if (this.m_ObjectFlags & CK_PARAMETERIN_SHARED) return null;
        return this.m_OutSource;
    }

    SetDirectSource(param: CKParameter): CKERROR {
        // Method logic here
    }

    ShareSourceWith(param: CKParameterIn): CKERROR {
        // Method logic here
    }

    SetType(type: CKParameterType, UpdateSource: CKBOOL = false, NewName: CKSTRING = null) {
        // Method logic here
    }

    SetGUID(guid: CKGUID, UpdateSource: CKBOOL = false, NewName: CKSTRING = null) {
        // Method logic here
    }

    GetType(): CKParameterType {
        return this.m_ParamType ? this.m_ParamType.Index : -1;
    }

    GetGUID(): CKGUID {
        return this.m_ParamType ? this.m_ParamType.Guid : new CKGUID(0);
    }

    SetOwner(o: CKObject) {
        this.m_Owner = o;
    }

    GetOwner(): CKObject {
        return this.m_Owner;
    }

    Enable(act: CKBOOL = true) {
        if (!act) {
            this.m_ObjectFlags |= CK_PARAMETERIN_DISABLED;
        } else {
            this.m_ObjectFlags &= ~CK_PARAMETERIN_DISABLED;
        }
    }

    IsEnabled(): CKBOOL {
        return (this.m_ObjectFlags & CK_PARAMETERIN_DISABLED) !== CK_PARAMETERIN_DISABLED;
    }

    // Omitted functions for save/load and other internal processing would go here

    static GetClassName(): string {
        // Method logic here
    }

    static GetDependenciesCount(mode: number): number {
        // Method logic here
    }

    static GetDependencies(i: number, mode: number): string {
        // Method logic here
    }

    static Register() {
        // Method logic here
    }

    static CreateInstance(Context: CKContext): CKParameterIn {
        // Method logic here
    }

    static ReleaseInstance(iContext: CKContext, instance: CKParameterIn) {
        // Method logic here
    }

    static Cast(iO: CKObject): CKParameterIn {
        return CKIsChildClassOf(iO, CKCID_PARAMETERIN) ? iO as CKParameterIn : null;
    }
}