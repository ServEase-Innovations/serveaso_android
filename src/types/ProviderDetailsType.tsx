// types.ts
export interface ProviderDetailsType {
    serviceproviderId: string;
    firstName: string;
    middleName?: string;
    lastName: string;
    gender: string;
    dob: string;
    diet: string;
    language?: string;
    experience?: string;
    otherServices?: string;
    housekeepingRole: string;
    availableTimeSlots?: string[];
  }
  
  export interface EnhancedProviderDetails extends ProviderDetailsType {
    selectedMorningTime?: number | null;
    selectedEveningTime?: number | null;
    matchedMorningSelection?: string | null;
    matchedEveningSelection?: string | null;
    startTime?: string;
    endTime?: string;
  }
  
  export interface DialogProps {
    open: boolean;
    handleClose: () => void;
    providerDetails: EnhancedProviderDetails;
  }