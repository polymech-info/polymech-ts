/*************************************************************************/
/*	File : CKEnums.h				 				 					 */
/*																		 */	
/*	Virtools SDK 														 */	 
/*	Copyright (c) Virtools 1999, All Rights Reserved.					 */	
/*************************************************************************/
#ifndef CKENUMS_H

#define CKENUMS_H "$Id:$"


/***************************************************
{filename:CK_OBJECT_FLAGS}
Summary: CKObject Flags

Remarks:
+ Flags specifying special settings for basic objects.
+ Some of this flags are shared with sub-classes such as CKParameterIn,CKParameterOut and CKBehaviorIO.
+ You rarely need to modify directly this flags through CKObject::SetFlags or CKObject::ModifyObjectFlags instead
you should always use the specific acces function (given between ()) which may need to perform additionnal operations.
See also: CKObject,CKObject::GetObjectFlags,CKObject::ModifyObjectFlags
*************************************************/
typedef enum CK_OBJECT_FLAGS {
	CK_OBJECT_INTERFACEOBJ			=	 0x00000001,		// Reserved for Inteface Use
	CK_OBJECT_PRIVATE				=	 0x00000002,		// The object must not be displayed in interface (Lists,Level view,etc...),nor should it be saved. (CKObject::IsPrivate()
	CK_OBJECT_INTERFACEMARK			=	 0x00000004,		
	CK_OBJECT_FREEID				=	 0x00000008,		// ID of this object can be released safely and is free to be reused by future CKobjects.
	CK_OBJECT_TOBEDELETED			=	 0x00000010,		// This object is being deleted
	CK_OBJECT_NOTTOBESAVED			=	 0x00000020,		// This object must not be saved 
	CK_OBJECT_VISIBLE				=	 0x00000040,		// This object is visible (CKObject::Show)
	CK_OBJECT_NAMESHARED			=	 0x00000080,		// This object has its name from another entity
	CK_OBJECT_DYNAMIC				=	 0x00000108,		// This object may be created or deleted at run-time, it also contails CK_OBJECT_FREEID. (CKObject::IsDynamic,CKContext::CreateObject)
	CK_OBJECT_HIERACHICALHIDE		=	 0x00000200,		// This object hides all its hierarchy (CKObject::Show)
	CK_OBJECT_UPTODATE				=	 0x00000400,		// (Camera,etc..)
	CK_OBJECT_TEMPMARKER			=	 0x00000800,		
	CK_OBJECT_ONLYFORFILEREFERENCE	=	 0x00001000,		
	CK_OBJECT_NOTTOBEDELETED		=	 0x00002000,		// This object must not be deleted in a clear all
	CK_OBJECT_APPDATA				=	 0x00004000,		// This object has app data	
	CK_OBJECT_SINGLEACTIVITY		=	 0x00008000,		// this object has an information of single activity (active at scene start,etc..)
	CK_OBJECT_LOADSKIPBEOBJECT		=	 0x00010000,		// When loading this object the CKBeObject part should be skipped
	CK_OBJECT_KEEPSINGLEACTIVITY	=	 0x00020000,		// this object must keep its information of single activity (active at scene start,etc..)
	CK_OBJECT_LOADREPLACINGOBJECT	=	 0x00040000,		// Indicates the object being loaded is being replaced
	
	CK_OBJECT_NOTTOBELISTEDANDSAVED	=	 0x00000023,		// Combination of Private and Not To Be Saved
	CK_OBJECT_SELECTIONSET			=	 0x00080000,		// if group, then it is a selection set, otherwise, temporary flag used for objects belonging to a selection set. Used by Virtools's Interface
	CK_OBJECT_VR_DISTRIBUTED		=	 0x00100000,		// distributed object for VR (ie mainly used for distributed parameters for VR)


// The following flags are specific to parameters (they are stored here for object's size purposes )
	CK_PARAMETEROUT_SETTINGS		=	0x00400000,			
	CK_PARAMETEROUT_PARAMOP			=	0x00800000,			// This parameter is the output of a CKParameterOperation (Automatically set by Engine)
	CK_PARAMETERIN_DISABLED			=	0x01000000,			// Parameter In or Out is disabled (CKBehavior::EnableInputParameter,CKBehavior::DisableInputParameter)	
	CK_PARAMETERIN_THIS				=	0x02000000,			// Special parameter type : its value and type are always equal to its owner (CKParameter::SetAsMyselfParameter)
	CK_PARAMETERIN_SHARED		    =	0x04000000,			
	CK_PARAMETEROUT_DELETEAFTERUSE 	=	0x08000000,			// When adding parameters to CKMessage, they can be automatically deleted when message is released (CKMessage::AddParameter)
	CK_OBJECT_PARAMMASK			  	=	0x0FC00000,			// Mask for options specific to parameters	

// The Following flags are specific	for Behavior ios (CKBehaviorIO)
	CK_BEHAVIORIO_IN				=	0x10000000,		// This BehaviorIO is a behavior input  (CKBehaviorIO::SetType}
	CK_BEHAVIORIO_OUT				=	0x20000000,		// This BehaviorIO is a behavior output (CKBehaviorIO::SetType)	
	CK_BEHAVIORIO_ACTIVE			=	0x40000000,		// This BehaviorIO is a currently active (CKBehaviorIO::Activate}
	CK_OBJECT_IOTYPEMASK		  	=	0x30000000,		
	CK_OBJECT_IOMASK			  	=	0xF0000000,		

	// The Following flags are specific	for Behavior ios (CKBehaviorIO)
	CKBEHAVIORLINK_RESERVED			=	0x10000000,		// This BehaviorIO is a behavior input  (CKBehaviorIO::SetType}
	CKBEHAVIORLINK_ACTIVATEDLASTFRAME =	0x20000000,		// This link had been activated last frame
	CK_OBJECT_BEHAVIORLINKMASK		=	0x30000000,		
} CK_OBJECT_FLAGS;



/************************************************************
{filename:CK_BEHAVIOR_FLAGS}
Summary: Flags settings for behaviors.
Remarks:
	+ When creating a prototype, you can precise various flags
	about how your behavior will act: whether it will send or receive message, 
	does the user may add inputs,outputs or parameters, is it active, etc. 

See also: CKBehaviorPrototype::SetBehaviorFlags,Behavior Prototype Creation
**********************************************************/
typedef enum CK_BEHAVIOR_FLAGS {
			CKBEHAVIOR_NONE							=0x00000000,	// Reserved for future use
			CKBEHAVIOR_ACTIVE						=0x00000001,	// This behavior is active
			CKBEHAVIOR_SCRIPT						=0x00000002,	// This behavior is a script
			CKBEHAVIOR_RESERVED1					=0x00000004,	// Reserved for internal use.
			CKBEHAVIOR_USEFUNCTION					=0x00000008,	// Behavior uses a function and not a graph
			CKBEHAVIOR_RESERVED2					=0x00000010,	// Reserved for internal use.
			CKBEHAVIOR_CUSTOMSETTINGSEDITDIALOG		=0x00000020,	// Behavior has a custom Dialog Box for settings edition .
			CKBEHAVIOR_WAITSFORMESSAGE				=0x00000040,	// Behavior is waiting for a message to activate one of its outputs
			CKBEHAVIOR_VARIABLEINPUTS				=0x00000080,	// Behavior may have its inputs changed by editing them
			CKBEHAVIOR_VARIABLEOUTPUTS				=0x00000100,	// Behavior may have its outputs changed by editing them
			CKBEHAVIOR_VARIABLEPARAMETERINPUTS		=0x00000200,	// Behavior may have its number of input parameters changed by editing them
			CKBEHAVIOR_VARIABLEPARAMETEROUTPUTS		=0x00000400,	// Behavior may have its number of output parameters changed by editing them
			CKBEHAVIOR_TOPMOST						=0x00004000,	// No other Behavior includes this one
			CKBEHAVIOR_BUILDINGBLOCK				=0x00008000,	// This Behavior is a building block. Automatically set by the engine when coming from a DLL.
			CKBEHAVIOR_MESSAGESENDER				=0x00010000,	// Behavior may send messages during its execution.
			CKBEHAVIOR_MESSAGERECEIVER				=0x00020000,	// Behavior may check messages during its execution.
			CKBEHAVIOR_TARGETABLE					=0x00040000,	// Behavior may be owned by a different object that the one to which its execution will apply.
			CKBEHAVIOR_CUSTOMEDITDIALOG				=0x00080000,	// This Behavior have a custom Dialog Box for parameters edition .
			CKBEHAVIOR_RESERVED0					=0x00100000,	// Reserved for internal use.
			CKBEHAVIOR_EXECUTEDLASTFRAME			=0x00200000,	// This behavior has been executed during last process. (Available only in profile mode )
			CKBEHAVIOR_DEACTIVATENEXTFRAME			=0x00400000,	// Behavior will be deactivated next frame
			CKBEHAVIOR_RESETNEXTFRAME				=0x00800000,	// Behavior will be reseted next frame
			CKBEHAVIOR_INTERNALLYCREATEDINPUTS		=0x01000000,	// Behavior execution may create/delete inputs
			CKBEHAVIOR_INTERNALLYCREATEDOUTPUTS		=0x02000000,	// Behavior execution may create/delete outputs
			CKBEHAVIOR_INTERNALLYCREATEDINPUTPARAMS	=0x04000000,	// Behavior execution may create/delete input parameters or change their type
			CKBEHAVIOR_INTERNALLYCREATEDOUTPUTPARAMS=0x08000000,	// Behavior execution may create/delete output parameters or change their type
			CKBEHAVIOR_INTERNALLYCREATEDLOCALPARAMS	=0x40000000,	// Behavior execution may create/delete local parameters or change their type
			CKBEHAVIOR_ACTIVATENEXTFRAME			=0x10000000,	// Behavior will be activated next frame
			CKBEHAVIOR_LOCKED						=0x20000000,	// Behavior is locked for utilisation in Virtools
			CKBEHAVIOR_LAUNCHEDONCE					=0x80000000,	// Behavior has not yet been launched...
}	CK_BEHAVIOR_FLAGS;            


/*************************************************
{filename:CK_BEHAVIOR_CALLBACKMASK}
Summary: Mask for the messages the callback function of a behavior should be aware of.

Remarks: 
+The callback function of a behavior may ignore some messages using this mask. 
+Don't forget to set the mask for the behavior callback function if you use one since it
can improve performance not to receive useless messages.
See also: CKBehaviorPrototype::SetBehaviorCallbackFct,Behavior Prototype Creation
*************************************************/
typedef enum CK_BEHAVIOR_CALLBACKMASK {
		CKCB_BEHAVIORPRESAVE		=0x00000001,	// Callback will be called for CKM_BEHAVIORPRESAVE messages 
		CKCB_BEHAVIORDELETE			=0x00000002,	// Callback will be called for CKM_BEHAVIORDELETE messages
		CKCB_BEHAVIORATTACH			=0x00000004,	// Callback will be called for CKM_BEHAVIORATTACH messages
		CKCB_BEHAVIORDETACH			=0x00000008,	// Callback will be called for CKM_BEHAVIORDETACH messages
		CKCB_BEHAVIORPAUSE			=0x00000010,	// Callback will be called for CKM_BEHAVIORPAUSE messages
		CKCB_BEHAVIORRESUME			=0x00000020,	// Callback will be called for CKM_BEHAVIORRESUME messages
		CKCB_BEHAVIORCREATE			=0x00000040,	// Callback will be called for CKM_BEHAVIORCREATE messages
		CKCB_BEHAVIORRESET			=0x00001000,	// Callback will be called for CKM_BEHAVIORRESET messages
		CKCB_BEHAVIORPOSTSAVE		=0x00000100,	// Callback will be called for CKM_BEHAVIORPOSTSAVE messages
		CKCB_BEHAVIORLOAD			=0x00000200,	// Callback will be called for CKM_BEHAVIORLOAD messages
		CKCB_BEHAVIOREDITED			=0x00000400,	// Callback will be called for CKM_BEHAVIOREDITED messages
		CKCB_BEHAVIORSETTINGSEDITED	=0x00000800,	// Callback will be called for CKM_BEHAVIORSETTINGSEDITED messages
		CKCB_BEHAVIORREADSTATE		=0x00001000,	// Callback will be called for CKM_BEHAVIORREADSTATE messages
		CKCB_BEHAVIORNEWSCENE		=0x00002000,	// Callback will be called for CKM_BEHAVIORNEWSCENE messages
		CKCB_BEHAVIORACTIVATESCRIPT	=0x00004000,	// Callback will be called for CKM_BEHAVIORACTIVATESCRIPT messages
		CKCB_BEHAVIORDEACTIVATESCRIPT=0x00008000,	// Callback will be called for CKM_BEHAVIORDEACTIVATESCRIPT messages
		CKCB_BEHAVIORRESETINBREAKPOINT=0x00010000,	// Callback will be called for CKM_BEHAVIORRESETINBREAKPOINT messages

		CKCB_BEHAVIORBASE			=0x0000000E,	// Base flags :attach /detach /delete
		CKCB_BEHAVIORSAVELOAD		=0x00000301,	// Base flags for load and save
		CKCB_BEHAVIORPPR			=0x00000130,	// Base flags for play/pause/reset
		CKCB_BEHAVIOREDITIONS		=0x00000C00,	// Base flags for editions of settings or parameters
		CKCB_BEHAVIORALL			=0xFFFFFFFF,	// All flags 
} CK_BEHAVIOR_CALLBACKMASK;



/*************************************************
{filename:CK_BEHAVIOR_RETURN}
Summary: Return value for the behavior execution function.
Remarks: 
	+ Return value of a behavior execution function is used to activate it
	the next frame and handle errors.

	+ A return value with _RETRY (CKBR_ACTIVATENEXTFRAME bit set) forces the behavior to be reactivated next frame.

See also: CKBehaviorPrototype::SetFunction
*************************************************/
typedef enum CK_BEHAVIOR_RETURN
{
	CKBR_OK						= 0,		// Everything's ok. Behavior is deactivated unless one of its inputs is active.
	CKBR_ACTIVATENEXTFRAME		= 1,		// The behavior will be reactivated  next frame
	CKBR_ATTACHFAILED			= 2,		// The attach failed
	CKBR_DETACHFAILED			= 4,		// The attach failed
	CKBR_LOCKED					= 6,		// obsolete..
	CKBR_INFINITELOOP			= 8,		// The behavior has reached the infinite loop limit...
	CKBR_BREAK					= 10,		// Break the processing here => Keep on processing windows messages but keep on calling the behavior until 
											// it returns a different value (Used by script debugger )
	CKBR_GENERICERROR			= 0xA000,	// Something went wrong
	CKBR_BEHAVIORERROR			= 0xA002,	// The behavior gave to the code was wrong
	CKBR_OWNERERROR				= 0xA004,	// The owner isn't what it should be
	CKBR_PARAMETERERROR			= 0xA008,	// Some of the parameters are wrong
	CKBR_GENERICERROR_RETRY		= 0xA001,
	CKBR_BEHAVIORERROR_RETRY	= 0xA003,
	CKBR_OWNERERROR_RETRY		= 0xA005,
	CKBR_PARAMETERERROR_RETRY	= 0xA009,
	
	
} CK_BEHAVIOR_RETURN;


/*************************************************
{filename:CK_BEHAVIOR_TYPE}
Summary: Behavior Type.
Remarks: 
	+ Behaviors may be scripts, simpliest behaviors (a function) or elaborated graphs of sub-behaviors.

See also: CKBehavior::GetType
*************************************************/
typedef enum CK_BEHAVIOR_TYPE {
			CKBEHAVIORTYPE_BASE						=0x00000000,	// This Behavior is a most simple type of behavior ( a function )
			CKBEHAVIORTYPE_SCRIPT					=0x00000001,	// This Behavior is a script
			CKBEHAVIORTYPE_BEHAVIOR					=0x00000004,	// This Behavior is a simple one ( a graph )
}	CK_BEHAVIOR_TYPE;

/*************************************************
{filename:CK_PARAMETERTYPE_FLAGS}
Summary:  Flags settings for new parameter types

Remarks:
+These flags specify special settings for a parameter type.
+Parameter may have a fixed or variable buffer size, some may be hidden
so that they are not displayed in the interface.
See also: CKParameterTypeDesc
*************************************************/
typedef enum CK_PARAMETERTYPE_FLAGS {
			CKPARAMETERTYPE_VARIABLESIZE =	   0x00000001,	// Size of the buffer stored by the parameter may change
			CKPARAMETERTYPE_RESERVED     =	   0x00000002,	// Reserved
			CKPARAMETERTYPE_HIDDEN		 =	   0x00000004,	// This parameter type should not be shown in the interface
			CKPARAMETERTYPE_FLAGS		 =	   0x00000008,	// This parameter type is a flag (See CKParameterManager::RegisterNewFlags)
			CKPARAMETERTYPE_STRUCT		 =	   0x00000010,	// This parameter type is a structure of parameters (See CKParameterManager::RegisterNewStructure)
			CKPARAMETERTYPE_ENUMS		 =	   0x00000020,	// This parameter type is an enumeration (See CKParameterManager::RegisterNewEnum)
			CKPARAMETERTYPE_USER		 =	   0x00000040,	// This parameter type is a user-defined one created in the interface
			CKPARAMETERTYPE_NOENDIANCONV =	   0x00000080,	// Do not try to convert this parameter buffer On Big-Endian processors (strings, void buffer have this flags)
			CKPARAMETERTYPE_TOSAVE		 =	   0x00000100,	// Temporary flag set in CKFile::EndSave(). This parameter type is to be saved in the SaveData callback of managers. Used in Parameter Manager (used user's flags & enums)
} CK_PARAMETERTYPE_FLAGS;


/*************************************************
{filename:CK_ATTRIBUT_FLAGS}
Summary: Attribute Flags

Remarks: 
	+ When created a new attribute type with CKAttributeManager::RegisterNewAttributeType , it can 
	be given special properties that will control its behavior in the Dev interface and other
	special features such as the ability for an attribute to be copied or saved along with the object
	it belongs to.
See also: CKAttributeManager::RegisterNewAttributeType,CKAttributeManager::GetAttributeFlags
*************************************************/
typedef enum CK_ATTRIBUT_FLAGS {
	CK_ATTRIBUT_CAN_MODIFY		 = 0x00000001,	// This Attribute type may be renamed
	CK_ATTRIBUT_CAN_DELETE		 = 0x00000002,	// This Attribute type may be deleted 		
	CK_ATTRIBUT_HIDDEN			 = 0x00000004,	// This Attribute type will not appear in the Virtools Interface		
	CK_ATTRIBUT_DONOTSAVE		 = 0x00000008,	// This Attribute type will not be saved		
	CK_ATTRIBUT_USER			 = 0x00000010,	// This Attribute type was created by a user (in the Dev interface for example)
	CK_ATTRIBUT_SYSTEM			 = 0x00000020,	// This Attribute type was created by the system (Behavior Dll,Manager,etc...)
	CK_ATTRIBUT_DONOTCOPY		 = 0x00000040,	// This Attribute type will not be copied when the object that holds it is copied		
	CK_ATTRIBUT_TOSAVE			 = 0x00000080,	// Temporary flag set in CKFile::EndSave(). This parameter type is to be saved in the SaveData callback of managers. Used in Attribute Manager (used attributes)
} CK_ATTRIBUT_FLAGS;


//----------------------------------------------------------////
// Behavior Prototype  Flags								////
//----------------------------------------------------------////

 
typedef enum CK_BEHAVIORPROTOTYPE_FLAGS {
				CK_BEHAVIORPROTOTYPE_NORMAL		=0x00000001,			
				CK_BEHAVIORPROTOTYPE_HIDDEN		=0x00000002,
				CK_BEHAVIORPROTOTYPE_OBSOLETE	=0x00000004,	
} CK_BEHAVIORPROTOTYPE_FLAGS;


/*************************************************
{filename:CK_LOADMODE}
Summary: Specify the way an object just loaded should be handled when it already exists in the level.
{secret}

See also: 
*************************************************/
typedef enum CK_LOADMODE 
{
	CKLOAD_INVALID=-1,// Use the existing object instead of loading 
	CKLOAD_OK=0,		// Ignore ( Name unicity is broken )
	CKLOAD_REPLACE=1,	// Replace the existing object (Not yet implemented)
	CKLOAD_RENAME=2,	// Rename the loaded object
	CKLOAD_USECURRENT=3,// Use the existing object instead of loading 
} CK_LOADMODE,CK_CREATIONMODE;

/*************************************************
{filename:CK_OBJECTCREATION_OPTIONS}
Summary: Specify the way an object is created through CKCreateObject.

Remarks: 
	+ These flag controls the way an object is created, the most important of these flags
	being CK_OBJECTCREATION_DYNAMIC which, if set in CKCreateObject, make the newly created object 
	dynamic.
See also: CKContext::CreateObject,Dynamic Objects
*************************************************/
enum CK_OBJECTCREATION_OPTIONS
{
	CK_OBJECTCREATION_NONAMECHECK	= 0,	// Do not test for name unicity (may be overriden in special case)
	CK_OBJECTCREATION_REPLACE		= 1,	// Replace the current object by the object being loaded
	CK_OBJECTCREATION_RENAME		= 2,	// Rename the created object to ensure its uniqueness
	CK_OBJECTCREATION_USECURRENT	= 3,	// Do not create a new object, use the one with the same name instead
	CK_OBJECTCREATION_ASK			= 4,	//	If a duplicate name if found, opens a dialog box to ask the useror use automatic load mode if any.
	CK_OBJECTCREATION_FLAGSMASK		= 0x0000000F,	// Mask for previous values
	CK_OBJECTCREATION_DYNAMIC		= 0x00000010,	//	The object must be created dynamic
	CK_OBJECTCREATION_ACTIVATE		= 0x00000020,	//	The object will be copied/created active
	CK_OBJECTCREATION_NONAMECOPY	= 0x00000040	//	The object will take control of the string given to it directly, without copying it
};


#define CK_OBJECTCREATION_SameDynamic (IsDynamic() ? CK_OBJECTCREATION_DYNAMIC : CK_OBJECTCREATION_NONAMECHECK)

#define CK_OBJECTCREATION_Dynamic(x) (x ? CK_OBJECTCREATION_DYNAMIC : CK_OBJECTCREATION_NONAMECHECK)

/*************************************************
{filename:CK_DEPENDENCIES_OPMODE}
Summary: Specify the mode of operation of a CKDependenciesContext.

Remarks: 
	A CKDependenciesContext class is always used when it come to work
	with object dependencies (A mesh if a dependencies of a CK3dEntity for example)
See also: CKCreateObject
*************************************************/
typedef enum CK_DEPENDENCIES_OPMODE {
	CK_DEPENDENCIES_COPY			=	1,	// Copying objects
	CK_DEPENDENCIES_DELETE			=	2,	// Deleting objects
	CK_DEPENDENCIES_REPLACE			=	3,	
	CK_DEPENDENCIES_SAVE			=	4,	// Saving objects
	CK_DEPENDENCIES_BUILD			=	5,	// Building a list of dependencies
	CK_DEPENDENCIES_OPERATIONMODE	=	0xF
} CK_DEPENDENCIES_OPMODE;

/*************************************************
{filename:CK_FILE_WRITEMODE}
Summary: Specify the way files are saved to disk (compression)

Remarks :
	+ File write mode controls the format of a Virtools file when saved. More specifically it 
	controls whether compression is enabled and also if the Virtools Interface specific data
	should be stored in the file (if CKFILE_FORVIEWER flag is set , no interface data is saved)

See also: CKContext::SetFileWriteMode,CKContext::GetFileWriteMode,CKContext::SetCompressionLevel,CKContext::SetGlobalImagesSaveOptions,CKContext::SetGlobalSoundsSaveOptions
*************************************************/
typedef enum CK_FILE_WRITEMODE 
{
	CKFILE_UNCOMPRESSED	       =0,	// Save data uncompressed
	CKFILE_CHUNKCOMPRESSED_OLD =1,	// Obsolete
	CKFILE_EXTERNALTEXTURES_OLD=2,	// Obsolete : use CKContext::SetGlobalImagesSaveOptions instead.
	CKFILE_FORVIEWER           =4,	// Don't save Interface Data within the file, the level won't be editable anymore in the interface
	CKFILE_WHOLECOMPRESSED     =8,	// Compress the whole file
} CK_FILE_WRITEMODE;



/*************************************************
{filename:CK_CONFIG_FLAGS}
Summary: Flags specifying start options for Virtools

Remarks:
	Flags specifying start options for Virtools



See also: CKCreateContext
*************************************************/
typedef enum CK_CONFIG_FLAGS {
		CK_CONFIG_DISABLEDSOUND=			1,		// Prevent CK from initializing Sound Engines
		CK_CONFIG_DISABLEDINPUT=			2,		// Prevent CK from initializing Input Engines
		CK_CONFIG_DOWARN=					4		// Set this flag for message box warning (sound init failed, etc.)
} CK_CONFIG_FLAGS;


/*************************************************
{filename:CK_DESTROY_FLAGS}
Summary: Objects destruction Flags

Remarks: Flags specifying how objects should be deleted.


See also: CKContext::DestroyObjects,CKContext::DestroyObject
*************************************************/
typedef enum CK_DESTROY_FLAGS {
	CK_DESTROY_FREEID		= 0x00000001,		// Release the CK_ID of the object so that it can be re-used bu new objects.
	CK_DESTROY_NONOTIFY		= 0x00000002,		// Managers and other objects won't be notified of this deletion 
	CK_DESTROY_TEMPOBJECT	= 0x00000003,		// Combination for temporary objects : Do not notify and release CK_ID
} CK_DESTROY_FLAGS;


//----------------------------------------------------------////
// Data Array Flags and Enums              								////
//----------------------------------------------------------////

/************************************************
{filename:CK_BINARYOPERATOR}
Summary: Available operations between colums of a DataArray

See Also: CKDataArray::ColumnTransform, CKDataArray::ColumnsOperate
************************************************/
typedef enum CK_BINARYOPERATOR{
	CKADD	= 1,	// Addition
	CKSUB	= 2,	// Substraction
	CKMUL	= 3,	// Multiplication	
	CKDIV	= 4		// Division
} CK_BINARYOPERATOR;

/************************************************
{filename:CK_COMPOPERATOR}
Summary: Available comparisons between colums of a DataArray
Remarks:

See Also: CKDataArray::CreateGroup, CKDataArray::FindLine
************************************************/
typedef enum CK_COMPOPERATOR{
	CKEQUAL			= 1,	
	CKNOTEQUAL		= 2,
	CKLESSER		= 3,
	CKLESSEREQUAL	= 4,
	CKGREATER		= 5,
	CKGREATEREQUAL	= 6
} CK_COMPOPERATOR;



typedef enum CK_SETOPERATOR{
	CKUNION	= 1,			// Addition
	CKINTERSECTION = 2,		// Intersection
	CKSUBTRACTION	= 3,	// Subtraction	
} CK_SETOPERATOR;

/************************************************
{filename:CK_ARRAYTYPE}
Summary: Enum defining the format of a Data Array element.
Remarks:
	+ In a data array each column can contain data
	of the given type.

See Also: CKDataArray::InsertColumn, CKDataArray::GetColumnType
************************************************/
typedef enum CK_ARRAYTYPE{
	CKARRAYTYPE_INT = 1,		// an integer
	CKARRAYTYPE_FLOAT = 2,		// a float
	CKARRAYTYPE_STRING = 3,		// a pointer to a string
	CKARRAYTYPE_OBJECT = 4,		// a CKObject ID (CK_ID)
	CKARRAYTYPE_PARAMETER = 5	// a CKParameter ID
} CK_ARRAYTYPE;



/*************************************************
{filename:CK_LOAD_FLAGS}
Summary: Load Options.

Remarks:
+ This options apply when loading a Virtools file
or a importing a 3D Model file. 
+ They defines whether object geometry,only animations 
or only behaviors should be loaded.
+ One can specify (using the CK_LOAD_AS_DYNAMIC_OBJECT) if 
created CKObjects should be created as dynamic (See also Dynamic Objects)
See also : CKContext::Load,CKContext::CKSave
*************************************************/
typedef enum CK_LOAD_FLAGS {
			CK_LOAD_ANIMATION					=1<<0,	// Load animations
			CK_LOAD_GEOMETRY					=1<<1,	// Load geometry.
			CK_LOAD_DEFAULT						=CK_LOAD_GEOMETRY|CK_LOAD_ANIMATION,	// Load animations & geometry
			CK_LOAD_ASCHARACTER					=1<<2, // Load all the objects and create a character that contains them all .
			CK_LOAD_DODIALOG					=1<<3, // Check object name unicity and warns the user with a dialog box when duplicate names are found. 
			CK_LOAD_AS_DYNAMIC_OBJECT			=1<<4, // Objects loaded from this file may be deleted at run-time or are temporary
			CK_LOAD_AUTOMATICMODE				=1<<5, // Check object name unicity and automatically rename or replace according to the options specified in CKContext::SetAutomaticLoadMode
			CK_LOAD_CHECKDUPLICATES				=1<<6, // Check object name unicity (The list of duplicates is stored in the CKFile class after a OpenFile call
			CK_LOAD_CHECKDEPENDENCIES			=1<<7, // Check if every plugins needed are availables
			CK_LOAD_ONLYBEHAVIORS				=1<<8, // 
			CK_LOAD_REPLACEALL_WITHSCRIPT		=1<<9, // Replace all duplicates names, scripts included (old scripts are deleted)
} CK_LOAD_FLAGS;


/*************************************************
{filename:CK_PLUGIN_TYPE}
Summary: Type identifier for a Virtools plugin.

Remarks: 
+Each plugin must be given a type.
+This enumeration is used to identify a specific catagory 
of plugin when using the CKPluginManager.
See also: CKPluginManager,Creating New Plugins
*************************************************/
typedef enum CK_PLUGIN_TYPE {
	CKPLUGIN_BITMAP_READER		= 0,	// The plugin is bitmap (textures,sprites) loader
	CKPLUGIN_SOUND_READER		= 1,	// Sound Reader Plugin
	CKPLUGIN_MODEL_READER		= 2,	// 3D Model Reader 
	CKPLUGIN_MANAGER_DLL		= 3,	// The plugin implements a Manager
	CKPLUGIN_BEHAVIOR_DLL		= 4,	// The plugin implements one or more behaviors
	CKPLUGIN_RENDERENGINE_DLL	= 5,	// Render Engine plugin
	CKPLUGIN_MOVIE_READER		= 6,	// Movie (AVI,Mpeg) reader		
	CKPLUGIN_EXTENSION_DLL		= 7,	// Generic extension (definition of new parameter types or operations for ex.)	
} CK_PLUGIN_TYPE;


typedef enum CK_PARAMETER_FLAGS {
				CKPARAMETER_LOCAL	=0,  // The parameter is local to a CKBehavior
				CKPARAMETER_IN		=1,	 // The parameter is an input of a CKBehavior	
				CKPARAMETER_OUT		=2,	 // The	parameter is an output of a CKBehavior or a parameter of a CKBeObject
				CKPARAMETER_SETTING =3,	 // The	parameter is used as a setting parameter by a CKBehavior.
} CK_PARAMETER_FLAGS;



typedef enum CK_PROFILE_CATEGORY {
	CK_PROFILE_RENDERTIME		= 3,
	CK_PROFILE_IKTIME			= 7,
	CK_PROFILE_ANIMATIONTIME	= 6,
} CK_PROFILE_CATEGORY;

/**********************************************************
{filename:CK_BONES_REFERENTIAL}
Summary : Type of bone matrices send to the skinning shader

***************************************************************/
typedef enum CK_BONES_REFERENTIAL {
	
	CK_BONE_LOCAL			=	0x00000000,	// Matrices transformed from bones referential to skin holder referential
	CK_BONE_WORLD			,				// Matrices transformed from bones referential to world referential
	CK_BONE_WORLDVIEW		,				// Matrices transformed from bones referential to camera referential 

}CK_BONES_REFERENTIAL;


#endif
