export type ItemCategory = 'Phone' | 'Wallet' | 'Keys' | 'Documents' | 'Jewellery' | 'Other' | 'Electronics';

export type ItemStatus = 'Found' | 'Dropped at Hub' | 'Awaiting Approval' | 'Claimed' | 'Under verification' | 'Pending Valuation' | 'Ready for Claim' | 'Settled' | string;

export interface ProofInfo {
  fullName: string;
  mobileNumber: string;
  aadhaarPhotoName?: string;
  proofDetail: string; // Serial number, contents, IMEI etc.
  submittedAt: string;
  status: 'pending' | 'approved' | 'rejected';
}

export interface FoundItem {
  id: string;
  category: ItemCategory;
  name: string;
  location: string;
  date: string;
  hubId: string;
  status: ItemStatus;
  blurImg: string;
  clearImg: string;
  submissionId: string;
  description: string;
  reporterName: string;
  reporterEmail: string;
  rewardAmount: number;
  hasPaidEscrow: boolean;
  serviceFee: number;
  selectedHub?: string;
  hubLatitude?: number;
  hubLongitude?: number;
  proof?: ProofInfo;
}

export interface RecoveryHub {
  id: string;
  name: string;
  address: string;
  distance: string;
  gate?: string;
  latitude?: number;
  longitude?: number;
}

export interface UserProfile {
  name: string;
  email: string;
  avatarUrl: string;
  balance: number; // accumulated micro-rewards
  reportedCount: number;
  claimedCount: number;
  phone?: string;
}
