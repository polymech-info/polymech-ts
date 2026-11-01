import { GadmRegion } from "@/modules/places/gadm-picker/GadmPicker";

export interface LocationSelection {
  type: 'point' | 'gadm' | 'search' | 'job';
  lat?: number;
  lng?: number;
  address?: string;
  gadmRegions?: GadmRegion[];
  geojsons?: any[];
  searchResult?: any;
  jobId?: string;
  jobSummary?: any; // GridSearchSummary
  competitors?: any[];
  simulatorSettings?: any;
  label?: string;
}

export interface LocationPickerDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSelect: (selection: LocationSelection) => void;
  initialSelection?: LocationSelection;
}
