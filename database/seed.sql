INSERT INTO submissions (id, form_version, status)
VALUES (1, '3.0.0', 'draft');

INSERT INTO clinical_trial_core (
  submission_id,
  test_substance_id_code,
  type_clinical_trials,
  initial_reception_number,
  initial_note_date,
  serial_note_number
) VALUES (
  1,
  'ABC-101',
  '医薬品',
  '2026-000001',
  '2026-06-01',
  1
);

INSERT INTO note_information (
  submission_id,
  note_date,
  class_note,
  category_note
) VALUES (
  1,
  '2026-06-01',
  '初回届',
  '治験計画届'
);

INSERT INTO protocol_summaries (
  submission_id,
  protocol_number,
  phase_clinical_trial,
  type_clinical_trial,
  trial_objectives,
  planned_subjects_test_product,
  planned_subjects_total,
  target_disease,
  dosage_admin,
  start_date_clinical_trial,
  end_date_clinical_trial
) VALUES (
  1,
  'ABC101-JP-01',
  '第I相',
  'FIH / 用量漸増',
  '安全性、忍容性、薬物動態の評価',
  24,
  32,
  '固形がん',
  '単回投与および反復投与',
  '2026-08-01',
  '2027-03-31'
);
