import { pgTable, serial, text, timestamp, integer, doublePrecision } from 'drizzle-orm/pg-core';

// Primary Users Ledger
export const users = pgTable('users', {
  id: serial('id').primaryKey(),
  uid: text('uid').notNull().unique(), // Firebase Auth UID
  name: text('name'),
  email: text('email').notNull(),
  phone: text('phone'),
  createdAt: timestamp('created_at').defaultNow(),
});

// FindBack Found Items Report
export const foundItems = pgTable('found_items', {
  id: serial('id').primaryKey(),
  submissionId: text('submission_id'),
  finderName: text('finder_name'),
  finderEmail: text('finder_email'),
  finderPhone: text('finder_phone'),
  itemCategory: text('item_category'),
  itemDescription: text('item_description'),
  lossLocation: text('loss_location'),
  foundDate: text('found_date'),
  storageHub: text('storage_hub'),
  status: text('status'), // e.g. 'Draft', 'Submitted', 'Under Review', 'Approved', 'Rejected'
  imageReference: text('image_reference'),
  ownerProof: text('owner_proof'),
  rewardAmount: integer('reward_amount'),
  serviceFee: integer('service_fee'),
  selectedHub: text('selected_hub'),
  hubLatitude: doublePrecision('hub_latitude'),
  hubLongitude: doublePrecision('hub_longitude'),
  createdAt: timestamp('created_at').defaultNow(),
});

// FindBack Identity Verification
export const identityVerifications = pgTable('identity_verifications', {
  id: serial('id').primaryKey(),
  userEmail: text('user_email').notNull(),
  fullName: text('full_name'),
  idType: text('id_type'),
  idNumber: text('id_number'), // Note: Handle with client masking/redaction where needed
  verificationStatus: text('verification_status'), // e.g. 'Pending', 'Verified', 'Rejected'
  reviewNotes: text('review_notes'),
  documentLink: text('document_link'),
  createdAt: timestamp('created_at').defaultNow(),
});
