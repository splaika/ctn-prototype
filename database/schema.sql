PRAGMA foreign_keys = ON;

CREATE TABLE trial_series (
  id INTEGER PRIMARY KEY,
  trial_code TEXT NOT NULL UNIQUE,
  trial_code_display TEXT,
  trial_type TEXT NOT NULL DEFAULT 'drug',
  first_receipt_number TEXT,
  first_submission_date TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE submissions (
  id INTEGER PRIMARY KEY,
  trial_series_id INTEGER NOT NULL REFERENCES trial_series(id) ON DELETE CASCADE,
  source_version_id INTEGER,
  root_element TEXT NOT NULL DEFAULT 'CLINTRIALPLANNOTE',
  form_version TEXT NOT NULL DEFAULT '3.0.0',
  submission_type TEXT NOT NULL,
  change_category TEXT,
  submission_round INTEGER NOT NULL,
  receipt_number TEXT,
  note_date TEXT,
  planned_start_date TEXT,
  submission_due_date TEXT,
  status TEXT NOT NULL DEFAULT 'draft',
  workflow_stage TEXT NOT NULL DEFAULT 'draft',
  approved_at TEXT,
  submitted_at TEXT,
  gateway_receipt_number TEXT,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(trial_series_id, submission_round),
  FOREIGN KEY(source_version_id) REFERENCES submission_versions(id)
);

CREATE TABLE submission_versions (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  version_no TEXT NOT NULL,
  version_status TEXT NOT NULL DEFAULT 'draft',
  source_type TEXT NOT NULL DEFAULT 'manual',
  source_import_id INTEGER,
  parent_version_id INTEGER REFERENCES submission_versions(id),
  change_summary TEXT,
  locked_at TEXT,
  locked_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(submission_id, version_no)
);

CREATE TABLE pdf_import_jobs (
  id INTEGER PRIMARY KEY,
  trial_series_id INTEGER REFERENCES trial_series(id) ON DELETE SET NULL,
  source_file_name TEXT NOT NULL,
  source_file_uri TEXT,
  source_file_checksum TEXT,
  import_status TEXT NOT NULL DEFAULT 'uploaded',
  extraction_method TEXT NOT NULL DEFAULT 'text_or_ocr',
  extraction_confidence REAL,
  mapped_field_count INTEGER NOT NULL DEFAULT 0,
  total_field_count INTEGER NOT NULL DEFAULT 0,
  created_by TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE pdf_import_pages (
  id INTEGER PRIMARY KEY,
  import_job_id INTEGER NOT NULL REFERENCES pdf_import_jobs(id) ON DELETE CASCADE,
  page_no INTEGER NOT NULL,
  page_image_uri TEXT,
  extracted_text TEXT,
  ocr_confidence REAL,
  UNIQUE(import_job_id, page_no)
);

CREATE TABLE pdf_import_field_candidates (
  id INTEGER PRIMARY KEY,
  import_job_id INTEGER NOT NULL REFERENCES pdf_import_jobs(id) ON DELETE CASCADE,
  target_table TEXT NOT NULL,
  target_column TEXT NOT NULL,
  xsd_element TEXT,
  candidate_value_original TEXT,
  candidate_value_submission TEXT,
  page_no INTEGER,
  confidence REAL,
  review_status TEXT NOT NULL DEFAULT 'pending',
  reviewer TEXT,
  reviewed_at TEXT
);

CREATE TABLE submission_snapshots (
  id INTEGER PRIMARY KEY,
  version_id INTEGER NOT NULL REFERENCES submission_versions(id) ON DELETE CASCADE,
  entity_name TEXT NOT NULL,
  record_key TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(version_id, entity_name, record_key)
);

CREATE TABLE protocol_summaries (
  submission_id INTEGER PRIMARY KEY REFERENCES submissions(id) ON DELETE CASCADE,
  protocol_number TEXT NOT NULL,
  phase_clinical_trial TEXT NOT NULL,
  type_clinical_trial TEXT NOT NULL,
  trial_objectives TEXT NOT NULL,
  planned_subjects_test_product INTEGER,
  planned_subjects_total INTEGER NOT NULL,
  target_disease TEXT NOT NULL,
  dosage_admin TEXT NOT NULL,
  start_date_clinical_trial TEXT,
  end_date_clinical_trial TEXT,
  reason_onerous TEXT
);

CREATE TABLE premature_terminations (
  submission_id INTEGER PRIMARY KEY REFERENCES submissions(id) ON DELETE CASCADE,
  termination_date TEXT,
  reason_termination TEXT,
  post_termination_measure TEXT
);

CREATE TABLE charge_out_persons (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  charge_out_person_name_original TEXT NOT NULL,
  charge_out_person_name_submission TEXT NOT NULL,
  validity_reasons TEXT,
  UNIQUE(submission_id, sequence_no)
);

CREATE TABLE coordinating_investigators (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  keyinvest_name_original TEXT NOT NULL,
  keyinvest_name_submission TEXT NOT NULL,
  name_medical_institution_original TEXT,
  name_medical_institution_submission TEXT,
  keyinvest_affiliation TEXT,
  UNIQUE(submission_id, sequence_no)
);

CREATE TABLE contract_research_organizations (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  cro_name_original TEXT NOT NULL,
  cro_name_submission TEXT NOT NULL,
  cro_address_1_original TEXT,
  cro_address_1_submission TEXT,
  cro_address_2_original TEXT,
  cro_address_2_submission TEXT,
  cro_service TEXT,
  UNIQUE(submission_id, sequence_no)
);

CREATE TABLE primary_product_details (
  submission_id INTEGER PRIMARY KEY REFERENCES submissions(id) ON DELETE CASCADE,
  sponsor_name_original TEXT,
  sponsor_name_submission TEXT,
  sponsor_address_1_original TEXT,
  sponsor_address_1_submission TEXT,
  sponsor_address_2_original TEXT,
  sponsor_address_2_submission TEXT,
  manufacturer_importer_code TEXT,
  ingredients_quantities TEXT,
  dosage_form_code TEXT,
  manufacture_method TEXT,
  intended_indications_effects TEXT,
  efficacy_class_code_number TEXT,
  intended_dosage_admin TEXT,
  admin_route_code TEXT
);

CREATE TABLE submission_other_information (
  submission_id INTEGER PRIMARY KEY REFERENCES submissions(id) ON DELETE CASCADE,
  cartagena_type TEXT,
  cartagena_detail TEXT,
  biological_product_type TEXT,
  codx_applicable TEXT,
  combination_product_applicable TEXT,
  expanded_access_type TEXT,
  global_trial_applicable TEXT,
  global_trial_contents TEXT,
  gene_test_included TEXT,
  microdose_clinical_trial TEXT,
  combination_equipment_contents TEXT,
  other_comments_primary TEXT,
  other_comments_protocol TEXT
);

CREATE TABLE investigational_products (
  id INTEGER PRIMARY KEY,
  trial_series_id INTEGER NOT NULL REFERENCES trial_series(id) ON DELETE CASCADE,
  submission_id INTEGER REFERENCES submissions(id) ON DELETE SET NULL,
  sequence_no INTEGER NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'continued',
  product_category TEXT NOT NULL,
  product_name_original TEXT NOT NULL,
  product_name_submission TEXT NOT NULL,
  dosage_form TEXT,
  strength TEXT,
  xsd_path TEXT,
  active_flag INTEGER NOT NULL DEFAULT 1,
  UNIQUE(trial_series_id, sequence_no)
);

CREATE TABLE combination_products (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  product_category TEXT NOT NULL,
  identifier_original TEXT NOT NULL,
  identifier_submission TEXT NOT NULL,
  identifier_type TEXT,
  combination_category TEXT,
  other_combination_category TEXT,
  application_status TEXT,
  target_disease TEXT,
  dosage_admin TEXT,
  remarks TEXT,
  active_flag INTEGER NOT NULL DEFAULT 1,
  UNIQUE(submission_id, sequence_no)
);

CREATE TABLE medical_institutions (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'continued',
  institution_name_original TEXT NOT NULL,
  institution_name_submission TEXT NOT NULL,
  department TEXT,
  address_1_original TEXT,
  address_1_submission TEXT,
  address_2_original TEXT,
  address_2_submission TEXT,
  telephone TEXT,
  planned_subjects INTEGER,
  enrolled_subjects INTEGER,
  others TEXT,
  UNIQUE(submission_id, sequence_no)
);

CREATE TABLE doctor_master (
  id INTEGER PRIMARY KEY,
  doctor_code TEXT NOT NULL UNIQUE,
  name_original TEXT NOT NULL,
  name_submission TEXT NOT NULL,
  pronounce TEXT,
  medical_school_number TEXT,
  graduation_year TEXT,
  has_gaiji INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  updated_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE doctor_events (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  medical_institution_id INTEGER NOT NULL REFERENCES medical_institutions(id) ON DELETE CASCADE,
  doctor_id INTEGER NOT NULL REFERENCES doctor_master(id),
  sequence_no INTEGER NOT NULL,
  role TEXT NOT NULL,
  event_type TEXT NOT NULL,
  change_date TEXT NOT NULL,
  change_reason TEXT NOT NULL,
  name_original_at_submission TEXT NOT NULL,
  name_submission_at_submission TEXT NOT NULL,
  pronounce_at_submission TEXT,
  xsd_serial_element TEXT NOT NULL DEFAULT 'SERIALNO2',
  UNIQUE(submission_id, medical_institution_id, role, sequence_no)
);

CREATE TABLE regulatory_deadline_rules (
  id INTEGER PRIMARY KEY,
  target_event_type TEXT NOT NULL,
  target_role TEXT,
  due_months INTEGER NOT NULL,
  reminder_days_csv TEXT NOT NULL,
  active_flag INTEGER NOT NULL DEFAULT 1,
  UNIQUE(target_event_type, target_role)
);

CREATE TABLE regulatory_deadlines (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  source_record_id INTEGER NOT NULL,
  change_description TEXT NOT NULL,
  actual_change_date TEXT NOT NULL,
  due_date TEXT NOT NULL,
  due_rule_id INTEGER REFERENCES regulatory_deadline_rules(id),
  owner TEXT NOT NULL,
  approver TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open',
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE reminder_notifications (
  id INTEGER PRIMARY KEY,
  deadline_id INTEGER NOT NULL REFERENCES regulatory_deadlines(id) ON DELETE CASCADE,
  notify_to TEXT NOT NULL,
  notify_role TEXT NOT NULL,
  scheduled_for TEXT NOT NULL,
  sent_at TEXT,
  channel TEXT NOT NULL DEFAULT 'email',
  status TEXT NOT NULL DEFAULT 'scheduled',
  message TEXT
);

CREATE TABLE institution_product_quantities (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  medical_institution_id INTEGER NOT NULL REFERENCES medical_institutions(id) ON DELETE CASCADE,
  investigational_product_id INTEGER NOT NULL REFERENCES investigational_products(id),
  sequence_no INTEGER NOT NULL,
  planned_quantity TEXT,
  supplied_quantity TEXT,
  used_quantity TEXT,
  withdrawn_quantity TEXT,
  abrogated_quantity TEXT,
  UNIQUE(submission_id, medical_institution_id, investigational_product_id)
);

CREATE TABLE irbs (
  id INTEGER PRIMARY KEY,
  medical_institution_id INTEGER NOT NULL REFERENCES medical_institutions(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  irb_type TEXT NOT NULL,
  owner_name_original TEXT NOT NULL,
  owner_name_submission TEXT NOT NULL,
  address_1 TEXT,
  address_2 TEXT,
  UNIQUE(medical_institution_id, sequence_no)
);

CREATE TABLE smos_in_medical_institutions (
  id INTEGER PRIMARY KEY,
  medical_institution_id INTEGER NOT NULL REFERENCES medical_institutions(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  smo_name_original TEXT NOT NULL,
  smo_name_submission TEXT NOT NULL,
  smo_address_1_original TEXT,
  smo_address_1_submission TEXT,
  smo_address_2_original TEXT,
  smo_address_2_submission TEXT,
  smo_service TEXT,
  UNIQUE(medical_institution_id, sequence_no)
);

CREATE TABLE related_organizations (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  organization_role TEXT NOT NULL,
  change_type TEXT NOT NULL DEFAULT 'continued',
  name_original TEXT NOT NULL,
  name_submission TEXT NOT NULL,
  representative_name_original TEXT,
  representative_name_submission TEXT,
  address_1_original TEXT,
  address_1_submission TEXT,
  address_2_original TEXT,
  address_2_submission TEXT,
  organization_code TEXT,
  service_scope TEXT,
  UNIQUE(submission_id, organization_role, sequence_no)
);

CREATE TABLE contact_persons (
  id INTEGER PRIMARY KEY,
  related_organization_id INTEGER REFERENCES related_organizations(id) ON DELETE CASCADE,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  person_role TEXT NOT NULL,
  name_original TEXT NOT NULL,
  name_submission TEXT NOT NULL,
  title TEXT,
  phone TEXT,
  fax TEXT,
  email TEXT
);

CREATE TABLE gaiji_mappings (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  source_table TEXT NOT NULL,
  source_record_id INTEGER NOT NULL,
  source_column TEXT NOT NULL,
  original_text TEXT NOT NULL,
  submission_text TEXT NOT NULL,
  detected_character TEXT,
  code_point TEXT,
  detection_type TEXT NOT NULL,
  replacement_reason TEXT NOT NULL,
  confirmed_by TEXT,
  confirmed_at TEXT,
  attachment_document_id INTEGER,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE attached_documents (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  document_type TEXT NOT NULL,
  document_name TEXT NOT NULL,
  sharepoint_url TEXT,
  checksum TEXT,
  bookmark_status TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(submission_id, sequence_no)
);

CREATE TABLE remarks (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  detail TEXT NOT NULL,
  UNIQUE(submission_id, sequence_no)
);

CREATE TABLE referenced_notifications (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  sequence_no INTEGER NOT NULL,
  product_category TEXT NOT NULL,
  test_substance_id_code TEXT,
  serial_note_number INTEGER,
  reference_type TEXT,
  contents TEXT,
  UNIQUE(submission_id, sequence_no)
);

CREATE TABLE validation_results (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  severity TEXT NOT NULL,
  category TEXT NOT NULL,
  target_table TEXT,
  target_record_id INTEGER,
  target_column TEXT,
  message TEXT NOT NULL,
  resolved_at TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE approval_tasks (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  step_no INTEGER NOT NULL,
  task_name TEXT NOT NULL,
  assignee TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  signed_at TEXT,
  signature_meaning TEXT,
  comments TEXT,
  UNIQUE(submission_id, step_no)
);

CREATE TABLE workflow_instances (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  version_id INTEGER REFERENCES submission_versions(id) ON DELETE SET NULL,
  workflow_status TEXT NOT NULL DEFAULT 'draft',
  current_step TEXT NOT NULL DEFAULT 'draft',
  started_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE export_jobs (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER NOT NULL REFERENCES submissions(id) ON DELETE CASCADE,
  version_id INTEGER REFERENCES submission_versions(id) ON DELETE SET NULL,
  export_type TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'waiting_approval',
  file_uri TEXT,
  preview_file_uri TEXT,
  xsd_validation_result TEXT,
  pdf_review_status TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP,
  completed_at TEXT
);

CREATE TABLE audit_events (
  id INTEGER PRIMARY KEY,
  submission_id INTEGER REFERENCES submissions(id) ON DELETE CASCADE,
  actor TEXT NOT NULL,
  action TEXT NOT NULL,
  target_table TEXT,
  target_record_id INTEGER,
  target_column TEXT,
  before_value TEXT,
  after_value TEXT,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);
