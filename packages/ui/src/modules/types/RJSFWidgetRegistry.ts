// App Level Types & Widgets
import type { RegistryWidgetsType } from '@rjsf/utils';
import { customWidgets } from '@/modules/types/RJSFTemplates';
import { CategoryPickerWidget, FilePickerWidget, GroupPickerWidget, PagePickerWidget, PostPickerWidget, UserPickerWidget } from '@/modules/types/AppTypeWidgets';

/**
 * Full RJSF widget registry for app forms. Re-merges picker widgets explicitly so fields like `ui:widget: categoryPicker`
 * always resolve even if a consumer imported `customWidgets` before `RJSFTemplates` finished initializing (circular import edge cases).
 */
export const rjsfWidgetRegistry: RegistryWidgetsType = {
    ...customWidgets,
    categoryPicker: CategoryPickerWidget,
    userPicker: UserPickerWidget,
    groupPicker: GroupPickerWidget,
    pagePicker: PagePickerWidget,
    postPicker: PostPickerWidget,
    filePicker: FilePickerWidget,
};
