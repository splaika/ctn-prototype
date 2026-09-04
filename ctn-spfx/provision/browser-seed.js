// ===========================================================================
// CTN Suite — デモデータ投入スクリプト（ブラウザのコンソール用・自動生成）
// ---------------------------------------------------------------------------
// このファイルは scripts/gen-browser-seed.mjs が
// provision/ctn-lists.schema.json と seed.ts から生成します。直接編集しないこと。
//
// 前提: browser-setup.js でリストが作成済みであること。
//
// 使い方:
//   1. 対象の SharePoint サイトをブラウザで開く
//   2. F12 → Sources → Snippets → New snippet に貼り付けて Ctrl+Enter
//      （Console に直接貼れない場合。Console なら "allow pasting" を手入力後に貼付）
//
// SharePoint は項目IDを自分で採番するため、seed の文字列ID（inst-1 等）を
// 採番された数値IDへ張り替えながら投入します。
//
// 冪等ではありません。既にデータがある状態で実行すると重複します。
// 実行前に「投入済みか」を確認し、必要なら各リストの項目を削除してください。
// ===========================================================================
(async () => {
  const DB = {"compounds":[{"id":"cmp-abc","compoundCode":"ABC-123","targetCategory":100000100,"trialKind":"医薬品","initReceptNo":"R6薬第1234号","initNoteDate":"2026-03-25","devStatus":100000900,"sponsorId":"sp-1","drugName":"ABC-123（開発コード：リロマブ）","createdAt":"2026-03-20"},{"id":"cmp-srp","compoundCode":"SRP-204","targetCategory":100000100,"trialKind":"医薬品","initReceptNo":"R6薬第2210号","initNoteDate":"2026-01-15","devStatus":100000900,"sponsorId":"sp-1","drugName":"SRP-204（開発コード：ソラペジブ）","createdAt":"2026-01-10"},{"id":"cmp-klm","compoundCode":"KLM-330","targetCategory":100000100,"trialKind":"医薬品","initReceptNo":"R5薬第9987号","initNoteDate":"2025-11-10","devStatus":100000901,"sponsorId":"sp-1","drugName":"KLM-330（開発コード：カルメチニブ）","createdAt":"2025-11-05"}],"notifications":[{"id":"nt-abc-1","compoundId":"cmp-abc","notifType":"plan","filingCount":1,"kubun":100000200,"subj30dayReview":1,"plannedStartDate":"2026-05-01","noteDate":"2026-03-25","status":"submitted","changeLocations":[],"protocolNo":"ABC-123-001","phase":100000602,"trialType":100000701,"objectives":"関節リウマチ患者を対象としたABC-123の有効性及び安全性の検討（プラセボ対照無作為化二重盲検比較試験）","plannedSubjDrug":120,"plannedSubjTotal":240,"targetDisease":"関節リウマチ","periodStart":"2026-05-01","periodEnd":"2028-03-31","isGlobal":false,"sponsorId":"sp-1","applicBiological":0,"applicCartagena":0,"applicExpandedAccess":0,"otherCommentsProtocol":"実施計画書第2.0版（2026-03-10）に基づく。","croName":"株式会社シーアールオー・ジャパン","croAddress1":"東京都中央区日本橋1-1-1","croService":"モニタリング、データマネジメント、統計解析","remarks":"","footnote":"","studyDrugs":[{"id":"sd-abc-main","drugRole":100000400,"serialNo":1,"drugName":"ABC-123錠 25mg","plantName":"サンライズ製薬株式会社 湘南工場","plantAddress1":"神奈川県藤沢市城南4-2-1","plantAddress2":"","plantCode":"6A1234","ingredients":"1錠中 ABC-123 25mg","intendEffects":"関節リウマチ","efficacyClassCode":"399","intendDosage":"1日1回1錠を経口投与","manufactMethod":"化学合成した ABC-123 を含有する錠剤を製剤として製する。","dosageAdmin":"1日1回1錠を経口投与する。"},{"id":"sd-abc-plc","drugRole":100000401,"serialNo":2,"drugName":"ABC-123 プラセボ錠","combCategory":100001101,"idType":"治験識別記号","applicationStatus":"未承認","adrReport":"有","plantName":"サンライズ製薬株式会社 湘南工場","plantAddress1":"神奈川県藤沢市城南4-2-1","plantAddress2":"","plantCode":"6A1234","ingredients":"有効成分を含まない","intendEffects":"（対照薬）","efficacyClassCode":"399","intendDosage":"1日1回1錠を経口投与","manufactMethod":"被験薬と同一の外観を有する錠剤を製剤として製する。","dosageAdmin":"1日1回1錠を経口投与する。"}],"sites":[{"id":"site-abc1-a","institutionId":"inst-1","serialNo":1,"department":"リウマチ・膠原病内科","plannedSubjects":12,"irbId":"irb-1","crcStaffId":"crc-1","investigators":[{"id":"inv-1","doctorId":"doc-1","doctorRole":100000500,"serialNo":1,"changeType":100001000,"nameOriginal":"佐藤 誠一","nameFiling":"佐藤 誠一","pronounce":"さとう せいいち","medSchoolNo":"12345","graduationYear":"2001"},{"id":"inv-2","doctorId":"doc-3","doctorRole":100000501,"serialNo":2,"changeType":100001000,"nameOriginal":"鈴木 一郎","nameFiling":"鈴木 一郎","pronounce":"すずき いちろう","medSchoolNo":"34567","graduationYear":"2005"},{"id":"inv-3","doctorId":"doc-2","doctorRole":100000501,"serialNo":3,"changeType":100001000,"nameOriginal":"髙島 幸雄","nameFiling":"高島 幸雄","pronounce":"たかしま ゆきお","medSchoolNo":"23456","graduationYear":"1998"}],"quantities":[{"studyDrugId":"sd-abc-main","serialNo":1,"qtyPlanned":480},{"studyDrugId":"sd-abc-plc","serialNo":2,"qtyPlanned":480}]},{"id":"site-abc1-b","institutionId":"inst-2","serialNo":2,"department":"免疫・膠原病内科","plannedSubjects":10,"irbId":"irb-2","crcStaffId":"crc-2","investigators":[{"id":"inv-4","doctorId":"doc-5","doctorRole":100000500,"serialNo":4,"changeType":100001000,"nameOriginal":"田中 浩二","nameFiling":"田中 浩二","pronounce":"たなか こうじ","medSchoolNo":"56789","graduationYear":"2000"},{"id":"inv-5","doctorId":"doc-6","doctorRole":100000501,"serialNo":5,"changeType":100001000,"nameOriginal":"伊藤 さゆり","nameFiling":"伊藤 さゆり","pronounce":"いとう さゆり","medSchoolNo":"67890","graduationYear":"2010"}],"quantities":[{"studyDrugId":"sd-abc-main","serialNo":1,"qtyPlanned":400},{"studyDrugId":"sd-abc-plc","serialNo":2,"qtyPlanned":400}]}],"attachments":[{"id":"att-abc1-1","docType":100001200,"docName":"ABC-123-001_実施計画書_v1.0.pdf","spReference":"/CTN/ABC-123/plan/protocol_v1.0.pdf","hasBookmarks":true,"hasText":true,"attachStatus":100001300},{"id":"att-abc1-2","docType":100001201,"docName":"ABC-123_治験薬概要書_v3.pdf","spReference":"/CTN/ABC-123/plan/ib_v3.pdf","hasBookmarks":true,"hasText":true,"attachStatus":100001300}],"references":[],"inquiries":[{"id":"inq-abc1-1","inquiryDate":"2026-07-05","inquiryContent":"非臨床安全性試験（反復投与毒性）の追加データ提出について","responseDeadline":"2026-07-20","hasReplacement":false}],"createdBy":"u-a","createdAt":"2026-03-20","reviewedBy":"u-c","reviewedAt":"2026-03-24","submittedAt":"2026-03-25","xmlGeneratedAt":"2026-03-25"},{"id":"nt-abc-2","compoundId":"cmp-abc","notifType":"change","filingCount":1,"changeCount":1,"changeDate":"2026-04-10","changeReason":"分担医師（治験責任医師の異動なし）の追加・削除。","kubun":100000202,"receptNo":"R6薬第1234号","receptDate":"2026-06-12","plannedStartDate":"2026-05-01","noteDate":"2026-06-12","status":"submitted","changeLocations":[100000804],"protocolNo":"ABC-123-001","phase":100000602,"trialType":100000701,"objectives":"関節リウマチ患者を対象としたABC-123の有効性及び安全性の検討","plannedSubjDrug":120,"plannedSubjTotal":240,"targetDisease":"関節リウマチ","periodStart":"2026-05-01","periodEnd":"2028-03-31","isGlobal":false,"sponsorId":"sp-1","remarks":"分担医師1名を追加、1名を削除（異動による）。","footnote":"","studyDrugs":[{"id":"sd-abc-main","drugRole":100000400,"serialNo":1,"drugName":"ABC-123錠 25mg","plantName":"サンライズ製薬株式会社 湘南工場","plantAddress1":"神奈川県藤沢市城南4-2-1","plantAddress2":"","plantCode":"6A1234","ingredients":"1錠中 ABC-123 25mg","intendEffects":"関節リウマチ","efficacyClassCode":"399","intendDosage":"1日1回1錠を経口投与","manufactMethod":"化学合成した ABC-123 を含有する錠剤を製剤として製する。","dosageAdmin":"1日1回1錠を経口投与する。"},{"id":"sd-abc-plc","drugRole":100000401,"serialNo":2,"drugName":"ABC-123 プラセボ錠","combCategory":100001101,"idType":"治験識別記号","applicationStatus":"未承認","adrReport":"有","plantName":"サンライズ製薬株式会社 湘南工場","plantAddress1":"神奈川県藤沢市城南4-2-1","plantAddress2":"","plantCode":"6A1234","ingredients":"有効成分を含まない","intendEffects":"（対照薬）","efficacyClassCode":"399","intendDosage":"1日1回1錠を経口投与","manufactMethod":"被験薬と同一の外観を有する錠剤を製剤として製する。","dosageAdmin":"1日1回1錠を経口投与する。"}],"sites":[{"id":"site-abc2-a","institutionId":"inst-1","serialNo":1,"department":"リウマチ・膠原病内科","plannedSubjects":12,"irbId":"irb-1","crcStaffId":"crc-1","investigators":[{"id":"inv-6","doctorId":"doc-1","doctorRole":100000500,"serialNo":1,"changeType":100001003,"nameOriginal":"佐藤 誠一","nameFiling":"佐藤 誠一","pronounce":"さとう せいいち","medSchoolNo":"12345","graduationYear":"2001"},{"id":"inv-7","doctorId":"doc-2","doctorRole":100000501,"serialNo":2,"changeType":100001003,"nameOriginal":"髙島 幸雄","nameFiling":"高島 幸雄","pronounce":"たかしま ゆきお","medSchoolNo":"23456","graduationYear":"1998"},{"id":"inv-8","doctorId":"doc-7","doctorRole":100000501,"serialNo":3,"changeType":100001001,"nameOriginal":"渡辺 隆","nameFiling":"渡辺 隆","pronounce":"わたなべ たかし","medSchoolNo":"78901","graduationYear":"2003","changeDate":"2026-06-10","changeReason":"分担医師の追加（新規参加）"},{"id":"inv-9","doctorId":"doc-3","doctorRole":100000501,"serialNo":4,"changeType":100001002,"nameOriginal":"鈴木 一郎","nameFiling":"鈴木 一郎","pronounce":"すずき いちろう","medSchoolNo":"34567","graduationYear":"2005","changeDate":"2026-06-10","changeReason":"分担医師の異動（他施設へ転出）"}],"quantities":[{"studyDrugId":"sd-abc-main","serialNo":1,"qtyPlanned":480},{"studyDrugId":"sd-abc-plc","serialNo":2,"qtyPlanned":480}]}],"attachments":[],"references":[],"inquiries":[],"createdBy":"u-b","createdAt":"2026-06-08","reviewedBy":"u-c","reviewedAt":"2026-06-11","submittedAt":"2026-06-12","xmlGeneratedAt":"2026-06-12"},{"id":"nt-abc-3","compoundId":"cmp-abc","notifType":"completion","filingCount":1,"kubun":100000202,"receptNo":"R6薬第1234号","receptDate":"2028-04-05","noteDate":"2028-04-05","status":"review","changeLocations":[],"protocolNo":"ABC-123-001","objectives":"治験終了報告","plannedSubjDrug":120,"plannedSubjTotal":240,"targetDisease":"関節リウマチ","periodStart":"2026-05-01","periodEnd":"2028-03-31","isGlobal":false,"sponsorId":"sp-1","remarks":"全施設で予定症例登録を完了し、治験を終了した。","footnote":"","studyDrugs":[{"id":"sd-abc-main","drugRole":100000400,"serialNo":1,"drugName":"ABC-123錠 25mg","plantName":"サンライズ製薬株式会社 湘南工場","plantAddress1":"神奈川県藤沢市城南4-2-1","plantAddress2":"","plantCode":"6A1234","ingredients":"1錠中 ABC-123 25mg","intendEffects":"関節リウマチ","efficacyClassCode":"399","intendDosage":"1日1回1錠を経口投与","manufactMethod":"化学合成した ABC-123 を含有する錠剤を製剤として製する。","dosageAdmin":"1日1回1錠を経口投与する。"},{"id":"sd-abc-plc","drugRole":100000401,"serialNo":2,"drugName":"ABC-123 プラセボ錠","combCategory":100001101,"idType":"治験識別記号","applicationStatus":"未承認","adrReport":"有","plantName":"サンライズ製薬株式会社 湘南工場","plantAddress1":"神奈川県藤沢市城南4-2-1","plantAddress2":"","plantCode":"6A1234","ingredients":"有効成分を含まない","intendEffects":"（対照薬）","efficacyClassCode":"399","intendDosage":"1日1回1錠を経口投与","manufactMethod":"被験薬と同一の外観を有する錠剤を製剤として製する。","dosageAdmin":"1日1回1錠を経口投与する。"}],"sites":[{"id":"site-abc3-a","institutionId":"inst-1","serialNo":1,"department":"リウマチ・膠原病内科","plannedSubjects":12,"enrolledSubjects":11,"irbId":"irb-1","crcStaffId":"crc-1","investigators":[{"id":"inv-10","doctorId":"doc-1","doctorRole":100000500,"serialNo":1,"changeType":100001003,"nameOriginal":"佐藤 誠一","nameFiling":"佐藤 誠一","pronounce":"さとう せいいち","medSchoolNo":"12345","graduationYear":"2001"},{"id":"inv-11","doctorId":"doc-2","doctorRole":100000501,"serialNo":2,"changeType":100001003,"nameOriginal":"髙島 幸雄","nameFiling":"高島 幸雄","pronounce":"たかしま ゆきお","medSchoolNo":"23456","graduationYear":"1998"},{"id":"inv-12","doctorId":"doc-7","doctorRole":100000501,"serialNo":3,"changeType":100001003,"nameOriginal":"渡辺 隆","nameFiling":"渡辺 隆","pronounce":"わたなべ たかし","medSchoolNo":"78901","graduationYear":"2003"}],"quantities":[{"studyDrugId":"sd-abc-main","serialNo":1,"qtyPlanned":480,"qtySupplied":460,"qtyUsed":300,"qtyWithdrawn":120,"qtyAbrogated":40},{"studyDrugId":"sd-abc-plc","serialNo":2,"qtyPlanned":480,"qtySupplied":460,"qtyUsed":300,"qtyWithdrawn":120,"qtyAbrogated":40}]},{"id":"site-abc3-b","institutionId":"inst-2","serialNo":2,"department":"免疫・膠原病内科","plannedSubjects":10,"enrolledSubjects":9,"irbId":"irb-2","crcStaffId":"crc-2","investigators":[{"id":"inv-13","doctorId":"doc-5","doctorRole":100000500,"serialNo":4,"changeType":100001003,"nameOriginal":"田中 浩二","nameFiling":"田中 浩二","pronounce":"たなか こうじ","medSchoolNo":"56789","graduationYear":"2000"},{"id":"inv-14","doctorId":"doc-6","doctorRole":100000501,"serialNo":5,"changeType":100001003,"nameOriginal":"伊藤 さゆり","nameFiling":"伊藤 さゆり","pronounce":"いとう さゆり","medSchoolNo":"67890","graduationYear":"2010"}],"quantities":[{"studyDrugId":"sd-abc-main","serialNo":1,"qtyPlanned":400,"qtySupplied":380,"qtyUsed":250,"qtyWithdrawn":100,"qtyAbrogated":30},{"studyDrugId":"sd-abc-plc","serialNo":2,"qtyPlanned":400,"qtySupplied":380,"qtyUsed":250,"qtyWithdrawn":100,"qtyAbrogated":30}]}],"attachments":[],"references":[],"inquiries":[],"createdBy":"u-a","createdAt":"2028-03-28"},{"id":"nt-srp-1","compoundId":"cmp-srp","notifType":"plan","filingCount":1,"kubun":100000200,"subj30dayReview":1,"plannedStartDate":"2026-02-01","noteDate":"2026-01-15","status":"submitted","changeLocations":[],"protocolNo":"SRP-204-01","phase":100000600,"trialType":100000700,"objectives":"健康成人を対象としたSRP-204の薬物動態及び安全性の検討（第I相単回投与）","plannedSubjDrug":40,"plannedSubjTotal":40,"targetDisease":"潰瘍性大腸炎","periodStart":"2026-02-01","periodEnd":"2026-12-31","isGlobal":false,"sponsorId":"sp-1","remarks":"","footnote":"","studyDrugs":[{"id":"sd-srp-main","drugRole":100000400,"serialNo":1,"drugName":"SRP-204注 50mg","plantName":"サンライズ製薬株式会社 富士工場","plantAddress1":"静岡県富士市大渕2-7","plantAddress2":"","plantCode":"6A5678","ingredients":"1バイアル中 SRP-204 50mg","intendEffects":"潰瘍性大腸炎","efficacyClassCode":"239","intendDosage":"2週間ごとに点滴静注","manufactMethod":"遺伝子組換え技術により産生した SRP-204 を含有する注射剤を製剤として製する。","dosageAdmin":"2週間ごとに1バイアルを点滴静注する。"}],"sites":[{"id":"site-srp1-a","institutionId":"inst-3","serialNo":1,"department":"消化器内科","plannedSubjects":20,"irbId":"irb-3","crcStaffId":"crc-3","smoName":"臨床開発サポート株式会社","smoAddress1":"大阪府大阪市中央区本町3-4-10","smoService":"モニタリング補助・CRC派遣","investigators":[{"id":"inv-15","doctorId":"doc-9","doctorRole":100000500,"serialNo":1,"changeType":100001000,"nameOriginal":"小林 大輔","nameFiling":"小林 大輔","pronounce":"こばやし だいすけ","medSchoolNo":"90123","graduationYear":"2004"},{"id":"inv-16","doctorId":"doc-11","doctorRole":100000501,"serialNo":2,"changeType":100001000,"nameOriginal":"加藤 めぐみ","nameFiling":"加藤 めぐみ","pronounce":"かとう めぐみ","medSchoolNo":"22345","graduationYear":"2011"}],"quantities":[{"studyDrugId":"sd-srp-main","serialNo":1,"qtyPlanned":200}]}],"attachments":[{"id":"att-srp1-1","docType":100001200,"docName":"SRP-204-01_実施計画書_v1.0.pdf","spReference":"/CTN/SRP-204/plan/protocol_v1.0.pdf","hasBookmarks":true,"hasText":true,"attachStatus":100001300}],"references":[],"inquiries":[],"createdBy":"u-a","createdAt":"2026-01-10","reviewedBy":"u-c","reviewedAt":"2026-01-14","submittedAt":"2026-01-15","xmlGeneratedAt":"2026-01-15"},{"id":"nt-srp-2","compoundId":"cmp-srp","notifType":"change","filingCount":1,"changeCount":1,"changeDate":"2026-01-05","changeReason":"対象疾患にクローン病を追加。","kubun":100000200,"receptNo":"R6薬第2210号","receptDate":"2026-04-10","plannedStartDate":"2026-02-01","noteDate":"2026-04-10","status":"submitted","changeLocations":[100000801],"protocolNo":"SRP-204-01","phase":100000600,"trialType":100000700,"objectives":"対象疾患の追加（潰瘍性大腸炎に加えクローン病を追加）","plannedSubjDrug":40,"plannedSubjTotal":40,"targetDisease":"潰瘍性大腸炎、クローン病","periodStart":"2026-02-01","periodEnd":"2026-12-31","isGlobal":false,"sponsorId":"sp-1","remarks":"対象疾患を追加。","footnote":"","studyDrugs":[{"id":"sd-srp-main","drugRole":100000400,"serialNo":1,"drugName":"SRP-204注 50mg","plantName":"サンライズ製薬株式会社 富士工場","plantAddress1":"静岡県富士市大渕2-7","plantAddress2":"","plantCode":"6A5678","ingredients":"1バイアル中 SRP-204 50mg","intendEffects":"潰瘍性大腸炎","efficacyClassCode":"239","intendDosage":"2週間ごとに点滴静注","manufactMethod":"遺伝子組換え技術により産生した SRP-204 を含有する注射剤を製剤として製する。","dosageAdmin":"2週間ごとに1バイアルを点滴静注する。"}],"sites":[{"id":"site-srp2-a","institutionId":"inst-3","serialNo":1,"department":"消化器内科","plannedSubjects":20,"irbId":"irb-3","crcStaffId":"crc-3","investigators":[{"id":"inv-17","doctorId":"doc-9","doctorRole":100000500,"serialNo":1,"changeType":100001003,"nameOriginal":"小林 大輔","nameFiling":"小林 大輔","pronounce":"こばやし だいすけ","medSchoolNo":"90123","graduationYear":"2004"}],"quantities":[{"studyDrugId":"sd-srp-main","serialNo":1,"qtyPlanned":200}]}],"attachments":[],"references":[],"inquiries":[],"createdBy":"u-b","createdAt":"2026-04-05","reviewedBy":"u-c","reviewedAt":"2026-04-09","submittedAt":"2026-04-10","xmlGeneratedAt":"2026-04-10"},{"id":"nt-srp-3","compoundId":"cmp-srp","notifType":"change","filingCount":1,"changeCount":2,"changeDate":"2026-08-01","changeReason":"治験使用薬（併用薬）の追加。","kubun":100000201,"receptNo":"R6薬第2210号","receptDate":"","plannedStartDate":"2026-08-01","status":"draft","changeLocations":[100000803],"protocolNo":"SRP-204-01","phase":100000600,"trialType":100000700,"objectives":"治験使用薬（併用薬）の追加","plannedSubjDrug":40,"plannedSubjTotal":40,"targetDisease":"潰瘍性大腸炎、クローン病","periodStart":"2026-02-01","periodEnd":"2026-12-31","isGlobal":false,"sponsorId":"sp-1","remarks":"併用薬としてタクロリムスを追加。","footnote":"","studyDrugs":[{"id":"sd-srp-main","drugRole":100000400,"serialNo":1,"drugName":"SRP-204注 50mg","plantName":"サンライズ製薬株式会社 富士工場","plantAddress1":"静岡県富士市大渕2-7","plantAddress2":"","plantCode":"6A5678","ingredients":"1バイアル中 SRP-204 50mg","intendEffects":"潰瘍性大腸炎","efficacyClassCode":"239","intendDosage":"2週間ごとに点滴静注","manufactMethod":"遺伝子組換え技術により産生した SRP-204 を含有する注射剤を製剤として製する。","dosageAdmin":"2週間ごとに1バイアルを点滴静注する。"},{"id":"sd-srp-adj","drugRole":100000401,"serialNo":2,"drugName":"タクロリムスカプセル（併用薬）","combCategory":100001102,"idType":"一般的名称","applicationStatus":"既承認","adrReport":"有","plantName":"アステラ製薬株式会社 高岡工場","plantAddress1":"富山県高岡市長慶寺700","plantAddress2":"","plantCode":"3B0011","ingredients":"1カプセル中 タクロリムス 0.5mg","intendEffects":"（併用薬）","efficacyClassCode":"399","intendDosage":"1日2回経口投与","manufactMethod":"国内承認製剤を購入して用いる。","dosageAdmin":"1日2回1カプセルを経口投与する。"}],"sites":[{"id":"site-srp3-a","institutionId":"inst-3","serialNo":1,"department":"消化器内科","plannedSubjects":20,"irbId":"irb-3","crcStaffId":"crc-3","investigators":[{"id":"inv-18","doctorId":"doc-9","doctorRole":100000500,"serialNo":1,"changeType":100001003,"nameOriginal":"小林 大輔","nameFiling":"小林 大輔","pronounce":"こばやし だいすけ","medSchoolNo":"90123","graduationYear":"2004"}],"quantities":[{"studyDrugId":"sd-srp-main","serialNo":1,"qtyPlanned":200},{"studyDrugId":"sd-srp-adj","serialNo":2,"qtyPlanned":100}]}],"attachments":[],"references":[],"inquiries":[],"createdBy":"u-a","createdAt":"2026-07-08"},{"id":"nt-klm-1","compoundId":"cmp-klm","notifType":"plan","filingCount":1,"kubun":100000200,"subj30dayReview":1,"plannedStartDate":"2025-12-01","noteDate":"2025-11-10","status":"submitted","changeLocations":[],"protocolNo":"KLM-330-101","phase":100000600,"trialType":100000700,"objectives":"非小細胞肺癌患者を対象としたKLM-330の第I相用量漸増試験","plannedSubjDrug":30,"plannedSubjTotal":30,"targetDisease":"非小細胞肺癌","periodStart":"2025-12-01","periodEnd":"2027-06-30","isGlobal":false,"sponsorId":"sp-1","remarks":"","footnote":"","studyDrugs":[{"id":"sd-klm-main","drugRole":100000400,"serialNo":1,"drugName":"KLM-330カプセル 100mg","plantName":"サンライズ製薬株式会社 湘南工場","plantAddress1":"神奈川県藤沢市城南4-2-1","plantAddress2":"","plantCode":"6A1234","ingredients":"1カプセル中 KLM-330 100mg","intendEffects":"非小細胞肺癌","efficacyClassCode":"429","intendDosage":"1日2回 食後経口投与"}],"sites":[{"id":"site-klm1-a","institutionId":"inst-4","serialNo":1,"department":"腫瘍内科","plannedSubjects":15,"irbId":"irb-4","crcStaffId":"crc-4","investigators":[{"id":"inv-19","doctorId":"doc-10","doctorRole":100000500,"serialNo":1,"changeType":100001000,"nameOriginal":"德永 明","nameFiling":"徳永 明","pronounce":"とくなが あきら","medSchoolNo":"11234","graduationYear":"1999"},{"id":"inv-20","doctorId":"doc-8","doctorRole":100000501,"serialNo":2,"changeType":100001000,"nameOriginal":"中村 由美","nameFiling":"中村 由美","pronounce":"なかむら ゆみ","medSchoolNo":"89012","graduationYear":"2012"}],"quantities":[{"studyDrugId":"sd-klm-main","serialNo":1,"qtyPlanned":300}]}],"attachments":[],"references":[],"inquiries":[],"createdBy":"u-a","createdAt":"2025-11-05","reviewedBy":"u-c","reviewedAt":"2025-11-09","submittedAt":"2025-11-10","xmlGeneratedAt":"2025-11-10"},{"id":"nt-klm-2","compoundId":"cmp-klm","notifType":"devDiscontinuation","filingCount":1,"kubun":100000202,"noteDate":"2026-06-25","status":"submitted","changeLocations":[],"protocolNo":"KLM-330-101","terminationDate":"2026-06-20","terminationReason":"開発方針の見直しにより本剤の開発を中止する。","objectives":"開発中止報告","targetDisease":"非小細胞肺癌","isGlobal":false,"sponsorId":"sp-1","remarks":"開発中止のため、以降の治験届出は行わない。安全性情報は継続してフォローする。","footnote":"","studyDrugs":[],"sites":[],"attachments":[],"references":[],"inquiries":[],"createdBy":"u-a","createdAt":"2026-06-22","reviewedBy":"u-c","reviewedAt":"2026-06-24","submittedAt":"2026-06-25","xmlGeneratedAt":"2026-06-25"}],"institutions":[{"id":"inst-1","code":"H001","name":"北央大学医学部附属病院","address1":"北海道札幌市北区北15条西7丁目","address2":"","telNo":"011-706-5000","active":true,"departments":["血液内科","腫瘍内科","呼吸器内科"]},{"id":"inst-2","code":"H002","name":"東京メディカルセンター","address1":"東京都目黒区東が丘2-5-1","address2":"","telNo":"03-3411-0111","active":true,"departments":["消化器内科","内科","外科"]},{"id":"inst-3","code":"H003","name":"浪速総合医療センター","address1":"大阪府大阪市住吉区東粉浜4-1-8","address2":"","telNo":"06-6672-1221","active":true,"departments":["リウマチ・膠原病内科","整形外科"]},{"id":"inst-4","code":"H004","name":"名古屋臨床研究病院","address1":"愛知県名古屋市昭和区妙見町2-9","address2":"","telNo":"052-832-1181","active":true,"departments":["腫瘍内科","乳腺外科","皮膚科"]},{"id":"inst-5","code":"H005","name":"九州先端医療病院","address1":"福岡県福岡市南区大楠3-1-1","address2":"","telNo":"092-541-4936","active":true,"departments":["神経内科","脳神経外科"]}],"doctors":[{"id":"doc-1","doctorNo":"D0001","nameOriginal":"佐藤 誠一","nameFiling":"佐藤 誠一","pronounce":"さとう せいいち","medSchoolNo":"12345","graduationYear":"2001","hasGaiji":false,"institutionId":"inst-1","active":true},{"id":"doc-2","doctorNo":"D0002","nameOriginal":"髙島 幸雄","nameFiling":"高島 幸雄","pronounce":"たかしま ゆきお","medSchoolNo":"23456","graduationYear":"1998","hasGaiji":true,"institutionId":"inst-1","active":true},{"id":"doc-3","doctorNo":"D0003","nameOriginal":"鈴木 一郎","nameFiling":"鈴木 一郎","pronounce":"すずき いちろう","medSchoolNo":"34567","graduationYear":"2005","hasGaiji":false,"institutionId":"inst-1","active":true},{"id":"doc-4","doctorNo":"D0004","nameOriginal":"山﨑 玲奈","nameFiling":"山崎 玲奈","pronounce":"やまざき れな","medSchoolNo":"45678","graduationYear":"2008","hasGaiji":true,"institutionId":"inst-3","active":true},{"id":"doc-5","doctorNo":"D0005","nameOriginal":"田中 浩二","nameFiling":"田中 浩二","pronounce":"たなか こうじ","medSchoolNo":"56789","graduationYear":"2000","hasGaiji":false,"institutionId":"inst-2","active":true},{"id":"doc-6","doctorNo":"D0006","nameOriginal":"伊藤 さゆり","nameFiling":"伊藤 さゆり","pronounce":"いとう さゆり","medSchoolNo":"67890","graduationYear":"2010","hasGaiji":false,"institutionId":"inst-2","active":true},{"id":"doc-7","doctorNo":"D0007","nameOriginal":"渡辺 隆","nameFiling":"渡辺 隆","pronounce":"わたなべ たかし","medSchoolNo":"78901","graduationYear":"2003","hasGaiji":false,"institutionId":"inst-1","active":true},{"id":"doc-8","doctorNo":"D0008","nameOriginal":"中村 由美","nameFiling":"中村 由美","pronounce":"なかむら ゆみ","medSchoolNo":"89012","graduationYear":"2012","hasGaiji":false,"institutionId":"inst-4","active":true},{"id":"doc-9","doctorNo":"D0009","nameOriginal":"小林 大輔","nameFiling":"小林 大輔","pronounce":"こばやし だいすけ","medSchoolNo":"90123","graduationYear":"2004","hasGaiji":false,"institutionId":"inst-3","active":true},{"id":"doc-10","doctorNo":"D0010","nameOriginal":"德永 明","nameFiling":"徳永 明","pronounce":"とくなが あきら","medSchoolNo":"11234","graduationYear":"1999","hasGaiji":true,"institutionId":"inst-4","active":true},{"id":"doc-11","doctorNo":"D0011","nameOriginal":"加藤 めぐみ","nameFiling":"加藤 めぐみ","pronounce":"かとう めぐみ","medSchoolNo":"22345","graduationYear":"2011","hasGaiji":false,"institutionId":"inst-3","active":true},{"id":"doc-12","doctorNo":"D0012","nameOriginal":"濵田 亮","nameFiling":"浜田 亮","pronounce":"はまだ りょう","medSchoolNo":"33456","graduationYear":"2007","hasGaiji":true,"institutionId":"inst-5","active":true}],"siteStaff":[{"id":"crc-1","name":"星野 恵","kana":"ほしの めぐみ","role":"CRC","institutionId":"inst-1","telNo":"011-706-5011","mail":"hoshino@hokuo-u.example.jp","active":true},{"id":"crc-2","name":"森田 拓也","kana":"もりた たくや","role":"CRC","institutionId":"inst-2","telNo":"03-3411-0122","mail":"morita@tmc.example.jp","active":true},{"id":"crc-3","name":"岡本 千夏","kana":"おかもと ちなつ","role":"CRC","institutionId":"inst-3","telNo":"06-6672-1233","mail":"okamoto@naniwa.example.jp","active":true},{"id":"crc-4","name":"藤井 健","kana":"ふじい けん","role":"CRC","institutionId":"inst-4","telNo":"052-832-1194","mail":"fujii@nagoya-cr.example.jp","active":true},{"id":"crc-5","name":"松本 あおい","kana":"まつもと あおい","role":"CRC","institutionId":"inst-5","telNo":"092-541-4945","mail":"matsumoto@kyushu-am.example.jp","active":true},{"id":"crc-6","name":"西村 大和","kana":"にしむら やまと","role":"事務局","institutionId":"inst-1","telNo":"011-706-5099","mail":"chiken-office@hokuo-u.example.jp","active":true}],"irbs":[{"id":"irb-1","irbType":100001400,"ownerName":"北央大学医学部附属病院 治験審査委員会","address1":"北海道札幌市北区北15条西7丁目","address2":"","active":true},{"id":"irb-2","irbType":100001400,"ownerName":"東京メディカルセンター治験審査委員会","address1":"東京都目黒区東が丘2-5-1","address2":"","active":true},{"id":"irb-3","irbType":100001401,"ownerName":"中央治験審査委員会（NPO臨床研究支援機構）","address1":"東京都千代田区神田駿河台1-8-11","address2":"","active":true},{"id":"irb-4","irbType":100001400,"ownerName":"名古屋臨床研究病院 治験審査委員会","address1":"愛知県名古屋市昭和区妙見町2-9","address2":"","active":true}],"codes":[{"id":"code-df-a1","kind":"dosageForm","code":"A1","name":"錠剤","group":"経口投与する製剤","active":true},{"id":"code-df-a2","kind":"dosageForm","code":"A2","name":"カプセル剤","group":"経口投与する製剤","active":true},{"id":"code-df-a3","kind":"dosageForm","code":"A3","name":"顆粒剤","group":"経口投与する製剤","active":true},{"id":"code-df-a4","kind":"dosageForm","code":"A4","name":"散剤","group":"経口投与する製剤","active":true},{"id":"code-df-a5","kind":"dosageForm","code":"A5","name":"経口液剤","group":"経口投与する製剤","active":true},{"id":"code-df-a6","kind":"dosageForm","code":"A6","name":"シロップ剤","group":"経口投与する製剤","active":true},{"id":"code-df-a7","kind":"dosageForm","code":"A7","name":"経口ゼリー剤","group":"経口投与する製剤","active":true},{"id":"code-df-az","kind":"dosageForm","code":"AZ","name":"その他の経口投与する製剤","group":"経口投与する製剤","active":true},{"id":"code-df-b1","kind":"dosageForm","code":"B1","name":"口腔用錠剤","group":"口腔内に適用する製剤","active":true},{"id":"code-df-b2","kind":"dosageForm","code":"B2","name":"口腔用スプレー剤","group":"口腔内に適用する製剤","active":true},{"id":"code-df-b3","kind":"dosageForm","code":"B3","name":"口腔用半固形剤","group":"口腔内に適用する製剤","active":true},{"id":"code-df-b4","kind":"dosageForm","code":"B4","name":"含嗽剤","group":"口腔内に適用する製剤","active":true},{"id":"code-df-b5","kind":"dosageForm","code":"B5","name":"口腔用液剤","group":"口腔内に適用する製剤","active":true},{"id":"code-df-bz","kind":"dosageForm","code":"BZ","name":"その他口腔内適用製剤","group":"口腔内に適用する製剤","active":true},{"id":"code-df-c1","kind":"dosageForm","code":"C1","name":"注射剤","group":"注射により投与する製剤","active":true},{"id":"code-df-cz","kind":"dosageForm","code":"CZ","name":"その他注射投与製剤","group":"注射により投与する製剤","active":true},{"id":"code-df-d1","kind":"dosageForm","code":"D1","name":"透析用剤","group":"透析に用いる製剤","active":true},{"id":"code-df-dz","kind":"dosageForm","code":"DZ","name":"その他の透析に用いる製剤","group":"透析に用いる製剤","active":true},{"id":"code-df-e1","kind":"dosageForm","code":"E1","name":"吸入剤","group":"気管支・肺に適用する製剤","active":true},{"id":"code-df-ez","kind":"dosageForm","code":"EZ","name":"その他気管支・肺適用製剤","group":"気管支・肺に適用する製剤","active":true},{"id":"code-df-f1","kind":"dosageForm","code":"F1","name":"点眼剤","group":"目に投与する製剤","active":true},{"id":"code-df-f2","kind":"dosageForm","code":"F2","name":"眼軟膏剤","group":"目に投与する製剤","active":true},{"id":"code-df-fz","kind":"dosageForm","code":"FZ","name":"その他の目に投与する製剤","group":"目に投与する製剤","active":true},{"id":"code-df-g1","kind":"dosageForm","code":"G1","name":"点耳剤","group":"耳に投与する製剤","active":true},{"id":"code-df-gz","kind":"dosageForm","code":"GZ","name":"その他の耳に投与する製剤","group":"耳に投与する製剤","active":true},{"id":"code-df-h1","kind":"dosageForm","code":"H1","name":"点鼻剤","group":"鼻に適用する製剤","active":true},{"id":"code-df-hz","kind":"dosageForm","code":"HZ","name":"その他の鼻に適用する製剤","group":"鼻に適用する製剤","active":true},{"id":"code-df-i1","kind":"dosageForm","code":"I1","name":"坐剤","group":"直腸に適用する製剤","active":true},{"id":"code-df-i2","kind":"dosageForm","code":"I2","name":"直腸用半固形剤","group":"直腸に適用する製剤","active":true},{"id":"code-df-i3","kind":"dosageForm","code":"I3","name":"注腸剤","group":"直腸に適用する製剤","active":true},{"id":"code-df-iz","kind":"dosageForm","code":"IZ","name":"その他の直腸に適用する製剤","group":"直腸に適用する製剤","active":true},{"id":"code-df-j1","kind":"dosageForm","code":"J1","name":"膣錠","group":"膣に適用する製剤","active":true},{"id":"code-df-j2","kind":"dosageForm","code":"J2","name":"膣用坐剤","group":"膣に適用する製剤","active":true},{"id":"code-df-jz","kind":"dosageForm","code":"JZ","name":"その他の膣に適用する製剤","group":"膣に適用する製剤","active":true},{"id":"code-df-k1","kind":"dosageForm","code":"K1","name":"外用固形剤","group":"皮膚等に適用する製剤","active":true},{"id":"code-df-k2","kind":"dosageForm","code":"K2","name":"外用液剤","group":"皮膚等に適用する製剤","active":true},{"id":"code-df-k3","kind":"dosageForm","code":"K3","name":"スプレー剤","group":"皮膚等に適用する製剤","active":true},{"id":"code-df-k4","kind":"dosageForm","code":"K4","name":"軟膏剤","group":"皮膚等に適用する製剤","active":true},{"id":"code-df-k5","kind":"dosageForm","code":"K5","name":"クリーム剤","group":"皮膚等に適用する製剤","active":true},{"id":"code-df-k6","kind":"dosageForm","code":"K6","name":"ゲル剤","group":"皮膚等に適用する製剤","active":true},{"id":"code-df-k7","kind":"dosageForm","code":"K7","name":"貼付剤","group":"皮膚等に適用する製剤","active":true},{"id":"code-df-kz","kind":"dosageForm","code":"KZ","name":"その他皮膚等適用製剤","group":"皮膚等に適用する製剤","active":true},{"id":"code-ar-11","kind":"adminRoute","code":"11","name":"経口投与","active":true},{"id":"code-ar-19","kind":"adminRoute","code":"19","name":"その他の内用","active":true},{"id":"code-ar-21","kind":"adminRoute","code":"21","name":"静脈内注射","active":true},{"id":"code-ar-22","kind":"adminRoute","code":"22","name":"筋肉内注射","active":true},{"id":"code-ar-23","kind":"adminRoute","code":"23","name":"皮下注射","active":true},{"id":"code-ar-24","kind":"adminRoute","code":"24","name":"動脈内注射","active":true},{"id":"code-ar-25","kind":"adminRoute","code":"25","name":"脊椎腔内注射","active":true},{"id":"code-ar-26","kind":"adminRoute","code":"26","name":"皮内注射","active":true},{"id":"code-ar-27","kind":"adminRoute","code":"27","name":"歯科注射","active":true},{"id":"code-ar-28","kind":"adminRoute","code":"28","name":"局所麻酔注射","active":true},{"id":"code-ar-29","kind":"adminRoute","code":"29","name":"その他の注射","active":true},{"id":"code-ar-31","kind":"adminRoute","code":"31","name":"一般外用剤","active":true},{"id":"code-ar-32","kind":"adminRoute","code":"32","name":"経皮吸収で全身作用を期待する製剤","active":true},{"id":"code-ar-33","kind":"adminRoute","code":"33","name":"舌下に適用する製剤","active":true},{"id":"code-ar-34","kind":"adminRoute","code":"34","name":"直腸、膣、尿道に適用する外用剤","active":true},{"id":"code-ar-35","kind":"adminRoute","code":"35","name":"眼科用剤","active":true},{"id":"code-ar-36","kind":"adminRoute","code":"36","name":"耳鼻科用剤","active":true},{"id":"code-ar-37","kind":"adminRoute","code":"37","name":"吸入剤","active":true},{"id":"code-ar-38","kind":"adminRoute","code":"38","name":"歯科外用及び口中剤等","active":true},{"id":"code-ar-39","kind":"adminRoute","code":"39","name":"その他の外用","active":true},{"id":"code-ar-70","kind":"adminRoute","code":"70","name":"人工透析","active":true},{"id":"code-ar-80","kind":"adminRoute","code":"80","name":"その他","active":true},{"id":"code-tc-111","kind":"therapeuticClass","code":"111","name":"全身麻酔剤","group":"中枢神経系用薬","active":true},{"id":"code-tc-112","kind":"therapeuticClass","code":"112","name":"催眠鎮静剤、抗不安剤","group":"中枢神経系用薬","active":true},{"id":"code-tc-113","kind":"therapeuticClass","code":"113","name":"抗てんかん剤","group":"中枢神経系用薬","active":true},{"id":"code-tc-114","kind":"therapeuticClass","code":"114","name":"解熱鎮痛消炎剤","group":"中枢神経系用薬","active":true},{"id":"code-tc-115","kind":"therapeuticClass","code":"115","name":"興奮剤、覚せい剤","group":"中枢神経系用薬","active":true},{"id":"code-tc-116","kind":"therapeuticClass","code":"116","name":"抗パーキンソン剤","group":"中枢神経系用薬","active":true},{"id":"code-tc-117","kind":"therapeuticClass","code":"117","name":"精神神経用剤","group":"中枢神経系用薬","active":true},{"id":"code-tc-118","kind":"therapeuticClass","code":"118","name":"総合感冒剤","group":"中枢神経系用薬","active":true},{"id":"code-tc-119","kind":"therapeuticClass","code":"119","name":"その他の中枢神経系用薬","group":"中枢神経系用薬","active":true},{"id":"code-tc-121","kind":"therapeuticClass","code":"121","name":"局所麻酔剤","group":"末梢神経系用薬","active":true},{"id":"code-tc-122","kind":"therapeuticClass","code":"122","name":"骨格筋弛緩剤","group":"末梢神経系用薬","active":true},{"id":"code-tc-123","kind":"therapeuticClass","code":"123","name":"自律神経剤","group":"末梢神経系用薬","active":true},{"id":"code-tc-124","kind":"therapeuticClass","code":"124","name":"鎮けい剤","group":"末梢神経系用薬","active":true},{"id":"code-tc-125","kind":"therapeuticClass","code":"125","name":"発汗剤、止汗剤","group":"末梢神経系用薬","active":true},{"id":"code-tc-129","kind":"therapeuticClass","code":"129","name":"その他の末梢神経系用薬","group":"末梢神経系用薬","active":true},{"id":"code-tc-131","kind":"therapeuticClass","code":"131","name":"眼科用剤","group":"感覚器官用薬","active":true},{"id":"code-tc-132","kind":"therapeuticClass","code":"132","name":"耳鼻科用剤","group":"感覚器官用薬","active":true},{"id":"code-tc-133","kind":"therapeuticClass","code":"133","name":"鎮暈剤","group":"感覚器官用薬","active":true},{"id":"code-tc-139","kind":"therapeuticClass","code":"139","name":"その他の感覚器官用薬","group":"感覚器官用薬","active":true},{"id":"code-tc-190","kind":"therapeuticClass","code":"190","name":"その他の神経系及び感覚器官用医薬品","group":"その他の神経系及び感覚器官用医薬品","active":true},{"id":"code-tc-211","kind":"therapeuticClass","code":"211","name":"強心剤","group":"循環器官用薬","active":true},{"id":"code-tc-212","kind":"therapeuticClass","code":"212","name":"不整脈用剤","group":"循環器官用薬","active":true},{"id":"code-tc-213","kind":"therapeuticClass","code":"213","name":"利尿剤","group":"循環器官用薬","active":true},{"id":"code-tc-214","kind":"therapeuticClass","code":"214","name":"血圧降下剤","group":"循環器官用薬","active":true},{"id":"code-tc-215","kind":"therapeuticClass","code":"215","name":"血管補強剤","group":"循環器官用薬","active":true},{"id":"code-tc-216","kind":"therapeuticClass","code":"216","name":"血管収縮剤","group":"循環器官用薬","active":true},{"id":"code-tc-217","kind":"therapeuticClass","code":"217","name":"血管拡張剤","group":"循環器官用薬","active":true},{"id":"code-tc-218","kind":"therapeuticClass","code":"218","name":"高脂血症用剤","group":"循環器官用薬","active":true},{"id":"code-tc-219","kind":"therapeuticClass","code":"219","name":"その他の循環器官用薬","group":"循環器官用薬","active":true},{"id":"code-tc-221","kind":"therapeuticClass","code":"221","name":"呼吸促進剤","group":"呼吸器官用薬","active":true},{"id":"code-tc-222","kind":"therapeuticClass","code":"222","name":"鎮咳剤","group":"呼吸器官用薬","active":true},{"id":"code-tc-223","kind":"therapeuticClass","code":"223","name":"去たん剤","group":"呼吸器官用薬","active":true},{"id":"code-tc-224","kind":"therapeuticClass","code":"224","name":"鎮咳去たん剤","group":"呼吸器官用薬","active":true},{"id":"code-tc-225","kind":"therapeuticClass","code":"225","name":"気管支拡張剤","group":"呼吸器官用薬","active":true},{"id":"code-tc-226","kind":"therapeuticClass","code":"226","name":"含嗽剤","group":"呼吸器官用薬","active":true},{"id":"code-tc-229","kind":"therapeuticClass","code":"229","name":"その他の呼吸器官用薬","group":"呼吸器官用薬","active":true},{"id":"code-tc-231","kind":"therapeuticClass","code":"231","name":"止しゃ剤、整腸剤","group":"消化器官用薬","active":true},{"id":"code-tc-232","kind":"therapeuticClass","code":"232","name":"消化性潰瘍用剤","group":"消化器官用薬","active":true},{"id":"code-tc-233","kind":"therapeuticClass","code":"233","name":"健胃消化剤","group":"消化器官用薬","active":true},{"id":"code-tc-234","kind":"therapeuticClass","code":"234","name":"制酸剤","group":"消化器官用薬","active":true},{"id":"code-tc-235","kind":"therapeuticClass","code":"235","name":"下剤、浣腸剤","group":"消化器官用薬","active":true},{"id":"code-tc-236","kind":"therapeuticClass","code":"236","name":"利胆剤","group":"消化器官用薬","active":true},{"id":"code-tc-237","kind":"therapeuticClass","code":"237","name":"複合胃腸剤","group":"消化器官用薬","active":true},{"id":"code-tc-239","kind":"therapeuticClass","code":"239","name":"その他の消化器官用薬","group":"消化器官用薬","active":true},{"id":"code-tc-241","kind":"therapeuticClass","code":"241","name":"脳下垂体ホルモン剤","group":"ホルモン剤（抗ホルモン剤を含む。）","active":true},{"id":"code-tc-242","kind":"therapeuticClass","code":"242","name":"唾液腺ホルモン剤","group":"ホルモン剤（抗ホルモン剤を含む。）","active":true},{"id":"code-tc-243","kind":"therapeuticClass","code":"243","name":"甲状腺、副甲状腺ホルモン剤","group":"ホルモン剤（抗ホルモン剤を含む。）","active":true},{"id":"code-tc-244","kind":"therapeuticClass","code":"244","name":"たん白同化ステロイド剤","group":"ホルモン剤（抗ホルモン剤を含む。）","active":true},{"id":"code-tc-245","kind":"therapeuticClass","code":"245","name":"副腎ホルモン剤","group":"ホルモン剤（抗ホルモン剤を含む。）","active":true},{"id":"code-tc-246","kind":"therapeuticClass","code":"246","name":"男性ホルモン剤","group":"ホルモン剤（抗ホルモン剤を含む。）","active":true},{"id":"code-tc-247","kind":"therapeuticClass","code":"247","name":"卵胞ホルモン及び黄体ホルモン剤","group":"ホルモン剤（抗ホルモン剤を含む。）","active":true},{"id":"code-tc-248","kind":"therapeuticClass","code":"248","name":"混合ホルモン剤","group":"ホルモン剤（抗ホルモン剤を含む。）","active":true},{"id":"code-tc-249","kind":"therapeuticClass","code":"249","name":"その他のホルモン剤（抗ホルモン剤を含む。）","group":"ホルモン剤（抗ホルモン剤を含む。）","active":true},{"id":"code-tc-251","kind":"therapeuticClass","code":"251","name":"泌尿器官用剤","group":"泌尿生殖器官及び肛門用薬","active":true},{"id":"code-tc-252","kind":"therapeuticClass","code":"252","name":"生殖器官用剤（性病予防剤を含む。）","group":"泌尿生殖器官及び肛門用薬","active":true},{"id":"code-tc-253","kind":"therapeuticClass","code":"253","name":"子宮収縮剤","group":"泌尿生殖器官及び肛門用薬","active":true},{"id":"code-tc-254","kind":"therapeuticClass","code":"254","name":"避妊剤","group":"泌尿生殖器官及び肛門用薬","active":true},{"id":"code-tc-255","kind":"therapeuticClass","code":"255","name":"痔疾用剤","group":"泌尿生殖器官及び肛門用薬","active":true},{"id":"code-tc-259","kind":"therapeuticClass","code":"259","name":"その他の泌尿生殖器官及び肛門用薬","group":"泌尿生殖器官及び肛門用薬","active":true},{"id":"code-tc-261","kind":"therapeuticClass","code":"261","name":"外皮用殺菌消毒剤","group":"外皮用薬","active":true},{"id":"code-tc-262","kind":"therapeuticClass","code":"262","name":"創傷保護剤","group":"外皮用薬","active":true},{"id":"code-tc-263","kind":"therapeuticClass","code":"263","name":"化膿性疾患用剤","group":"外皮用薬","active":true},{"id":"code-tc-264","kind":"therapeuticClass","code":"264","name":"鎮痛、鎮痒、収斂、消炎剤","group":"外皮用薬","active":true},{"id":"code-tc-265","kind":"therapeuticClass","code":"265","name":"寄生性皮ふ疾患用剤","group":"外皮用薬","active":true},{"id":"code-tc-266","kind":"therapeuticClass","code":"266","name":"皮ふ軟化剤（腐しょく剤を含む。）","group":"外皮用薬","active":true},{"id":"code-tc-267","kind":"therapeuticClass","code":"267","name":"毛髪用剤（発毛剤、脱毛剤、染毛剤、養毛剤）","group":"外皮用薬","active":true},{"id":"code-tc-268","kind":"therapeuticClass","code":"268","name":"浴剤","group":"外皮用薬","active":true},{"id":"code-tc-269","kind":"therapeuticClass","code":"269","name":"その他の外皮用薬","group":"外皮用薬","active":true},{"id":"code-tc-271","kind":"therapeuticClass","code":"271","name":"歯科用局所麻酔剤","group":"歯科口腔用薬","active":true},{"id":"code-tc-272","kind":"therapeuticClass","code":"272","name":"歯髄失活剤","group":"歯科口腔用薬","active":true},{"id":"code-tc-273","kind":"therapeuticClass","code":"273","name":"歯科用鎮痛鎮静剤（根管及び齲窩消毒剤を含む。）","group":"歯科口腔用薬","active":true},{"id":"code-tc-274","kind":"therapeuticClass","code":"274","name":"歯髄乾屍剤（根管充填剤を含む。）","group":"歯科口腔用薬","active":true},{"id":"code-tc-275","kind":"therapeuticClass","code":"275","name":"歯髄覆罩剤","group":"歯科口腔用薬","active":true},{"id":"code-tc-276","kind":"therapeuticClass","code":"276","name":"歯科用抗生物質製剤","group":"歯科口腔用薬","active":true},{"id":"code-tc-279","kind":"therapeuticClass","code":"279","name":"その他の歯科口腔用薬","group":"歯科口腔用薬","active":true},{"id":"code-tc-290","kind":"therapeuticClass","code":"290","name":"その他の個々の器官系用医薬品","group":"その他の個々の器官系用医薬品","active":true},{"id":"code-tc-311","kind":"therapeuticClass","code":"311","name":"ビタミンＡ及びＤ剤","group":"ビタミン剤","active":true},{"id":"code-tc-312","kind":"therapeuticClass","code":"312","name":"ビタミンＢ１剤","group":"ビタミン剤","active":true},{"id":"code-tc-313","kind":"therapeuticClass","code":"313","name":"ビタミンＢ剤（ビタミンＢ１剤を除く。）","group":"ビタミン剤","active":true},{"id":"code-tc-314","kind":"therapeuticClass","code":"314","name":"ビタミンＣ剤","group":"ビタミン剤","active":true},{"id":"code-tc-315","kind":"therapeuticClass","code":"315","name":"ビタミンＥ剤","group":"ビタミン剤","active":true},{"id":"code-tc-316","kind":"therapeuticClass","code":"316","name":"ビタミンＫ剤","group":"ビタミン剤","active":true},{"id":"code-tc-317","kind":"therapeuticClass","code":"317","name":"混合ビタミン剤（ビタミンＡ・Ｄ混合製剤を除く。）","group":"ビタミン剤","active":true},{"id":"code-tc-319","kind":"therapeuticClass","code":"319","name":"その他のビタミン剤","group":"ビタミン剤","active":true},{"id":"code-tc-321","kind":"therapeuticClass","code":"321","name":"カルシウム剤","group":"滋養強壮薬","active":true},{"id":"code-tc-322","kind":"therapeuticClass","code":"322","name":"無機質製剤","group":"滋養強壮薬","active":true},{"id":"code-tc-323","kind":"therapeuticClass","code":"323","name":"糖類剤","group":"滋養強壮薬","active":true},{"id":"code-tc-324","kind":"therapeuticClass","code":"324","name":"有機酸製剤","group":"滋養強壮薬","active":true},{"id":"code-tc-325","kind":"therapeuticClass","code":"325","name":"たん白アミノ酸製剤","group":"滋養強壮薬","active":true},{"id":"code-tc-326","kind":"therapeuticClass","code":"326","name":"臓器製剤","group":"滋養強壮薬","active":true},{"id":"code-tc-327","kind":"therapeuticClass","code":"327","name":"乳幼児用剤","group":"滋養強壮薬","active":true},{"id":"code-tc-329","kind":"therapeuticClass","code":"329","name":"その他の滋養強壮薬","group":"滋養強壮薬","active":true},{"id":"code-tc-331","kind":"therapeuticClass","code":"331","name":"血液代用剤","group":"血液・体液用薬","active":true},{"id":"code-tc-332","kind":"therapeuticClass","code":"332","name":"止血剤","group":"血液・体液用薬","active":true},{"id":"code-tc-333","kind":"therapeuticClass","code":"333","name":"血液凝固阻止剤","group":"血液・体液用薬","active":true},{"id":"code-tc-339","kind":"therapeuticClass","code":"339","name":"その他の血液・体液用薬","group":"血液・体液用薬","active":true},{"id":"code-tc-341","kind":"therapeuticClass","code":"341","name":"人工腎臓透析用剤","group":"人工透析用薬","active":true},{"id":"code-tc-342","kind":"therapeuticClass","code":"342","name":"腹膜透析用剤","group":"人工透析用薬","active":true},{"id":"code-tc-349","kind":"therapeuticClass","code":"349","name":"その他の人工透析用薬","group":"人工透析用薬","active":true},{"id":"code-tc-391","kind":"therapeuticClass","code":"391","name":"肝臓疾患用剤","group":"その他の代謝性医薬品","active":true},{"id":"code-tc-392","kind":"therapeuticClass","code":"392","name":"解毒剤","group":"その他の代謝性医薬品","active":true},{"id":"code-tc-393","kind":"therapeuticClass","code":"393","name":"習慣性中毒用剤","group":"その他の代謝性医薬品","active":true},{"id":"code-tc-394","kind":"therapeuticClass","code":"394","name":"痛風治療剤","group":"その他の代謝性医薬品","active":true},{"id":"code-tc-395","kind":"therapeuticClass","code":"395","name":"酵素製剤","group":"その他の代謝性医薬品","active":true},{"id":"code-tc-396","kind":"therapeuticClass","code":"396","name":"糖尿病用剤","group":"その他の代謝性医薬品","active":true},{"id":"code-tc-397","kind":"therapeuticClass","code":"397","name":"総合代謝性製剤","group":"その他の代謝性医薬品","active":true},{"id":"code-tc-399","kind":"therapeuticClass","code":"399","name":"他に分類されない代謝性医薬品","group":"その他の代謝性医薬品","active":true},{"id":"code-tc-411","kind":"therapeuticClass","code":"411","name":"クロロフィル製剤","group":"細胞賦活用薬","active":true},{"id":"code-tc-412","kind":"therapeuticClass","code":"412","name":"色素製剤","group":"細胞賦活用薬","active":true},{"id":"code-tc-419","kind":"therapeuticClass","code":"419","name":"その他の細胞賦活用薬","group":"細胞賦活用薬","active":true},{"id":"code-tc-421","kind":"therapeuticClass","code":"421","name":"アルキル化剤","group":"腫瘍用薬","active":true},{"id":"code-tc-422","kind":"therapeuticClass","code":"422","name":"代謝拮抗剤","group":"腫瘍用薬","active":true},{"id":"code-tc-423","kind":"therapeuticClass","code":"423","name":"抗腫瘍性抗生物質製剤","group":"腫瘍用薬","active":true},{"id":"code-tc-424","kind":"therapeuticClass","code":"424","name":"抗腫瘍性植物成分製剤","group":"腫瘍用薬","active":true},{"id":"code-tc-429","kind":"therapeuticClass","code":"429","name":"その他の腫瘍用薬","group":"腫瘍用薬","active":true},{"id":"code-tc-430","kind":"therapeuticClass","code":"430","name":"放射性医薬品","group":"放射性医薬品","active":true},{"id":"code-tc-441","kind":"therapeuticClass","code":"441","name":"抗ヒスタミン剤","group":"アレルギー用薬","active":true},{"id":"code-tc-442","kind":"therapeuticClass","code":"442","name":"刺激療法剤","group":"アレルギー用薬","active":true},{"id":"code-tc-443","kind":"therapeuticClass","code":"443","name":"非特異性免疫原製剤","group":"アレルギー用薬","active":true},{"id":"code-tc-449","kind":"therapeuticClass","code":"449","name":"その他のアレルギー用薬","group":"アレルギー用薬","active":true},{"id":"code-tc-490","kind":"therapeuticClass","code":"490","name":"その他の組織細胞機能用医薬品","group":"その他の組織細胞機能用医薬品","active":true},{"id":"code-tc-510","kind":"therapeuticClass","code":"510","name":"生薬","group":"生薬及び漢方処方に基づく医薬品","active":true},{"id":"code-tc-520","kind":"therapeuticClass","code":"520","name":"漢方製剤","group":"生薬及び漢方処方に基づく医薬品","active":true},{"id":"code-tc-590","kind":"therapeuticClass","code":"590","name":"その他の生薬及び漢方処方に基づく医薬品","group":"生薬及び漢方処方に基づく医薬品","active":true},{"id":"code-tc-611","kind":"therapeuticClass","code":"611","name":"主としてグラム陽性菌に作用するもの","group":"抗生物質製剤","active":true},{"id":"code-tc-612","kind":"therapeuticClass","code":"612","name":"主としてグラム陰性菌に作用するもの","group":"抗生物質製剤","active":true},{"id":"code-tc-613","kind":"therapeuticClass","code":"613","name":"主としてグラム陽性・陰性菌に作用するもの","group":"抗生物質製剤","active":true},{"id":"code-tc-614","kind":"therapeuticClass","code":"614","name":"主としてグラム陽性菌、マイコプラズマに作用するもの","group":"抗生物質製剤","active":true},{"id":"code-tc-615","kind":"therapeuticClass","code":"615","name":"主としてグラム陽性・陰性菌、リケッチア、クラミジアに作用するもの","group":"抗生物質製剤","active":true},{"id":"code-tc-616","kind":"therapeuticClass","code":"616","name":"主として抗酸菌に作用するもの","group":"抗生物質製剤","active":true},{"id":"code-tc-617","kind":"therapeuticClass","code":"617","name":"主としてカビに作用するもの","group":"抗生物質製剤","active":true},{"id":"code-tc-619","kind":"therapeuticClass","code":"619","name":"その他の抗生物質製剤（複合抗生物質製剤を含む。）","group":"抗生物質製剤","active":true},{"id":"code-tc-621","kind":"therapeuticClass","code":"621","name":"サルファ剤","group":"化学療法剤","active":true},{"id":"code-tc-622","kind":"therapeuticClass","code":"622","name":"抗結核剤","group":"化学療法剤","active":true},{"id":"code-tc-623","kind":"therapeuticClass","code":"623","name":"抗ハンセン病剤","group":"化学療法剤","active":true},{"id":"code-tc-624","kind":"therapeuticClass","code":"624","name":"合成抗菌剤","group":"化学療法剤","active":true},{"id":"code-tc-625","kind":"therapeuticClass","code":"625","name":"抗ウイルス剤","group":"化学療法剤","active":true},{"id":"code-tc-629","kind":"therapeuticClass","code":"629","name":"その他の化学療法剤","group":"化学療法剤","active":true},{"id":"code-tc-631","kind":"therapeuticClass","code":"631","name":"ワクチン類","group":"生物学的製剤","active":true},{"id":"code-tc-632","kind":"therapeuticClass","code":"632","name":"毒素及びトキソイド類","group":"生物学的製剤","active":true},{"id":"code-tc-633","kind":"therapeuticClass","code":"633","name":"抗毒素及び抗レプトスピラ血清類","group":"生物学的製剤","active":true},{"id":"code-tc-634","kind":"therapeuticClass","code":"634","name":"血液製剤類","group":"生物学的製剤","active":true},{"id":"code-tc-635","kind":"therapeuticClass","code":"635","name":"生物学的試験用製剤類","group":"生物学的製剤","active":true},{"id":"code-tc-636","kind":"therapeuticClass","code":"636","name":"混合生物学的製剤","group":"生物学的製剤","active":true},{"id":"code-tc-639","kind":"therapeuticClass","code":"639","name":"その他の生物学的製剤","group":"生物学的製剤","active":true},{"id":"code-tc-641","kind":"therapeuticClass","code":"641","name":"抗原虫剤","group":"寄生動物用薬","active":true},{"id":"code-tc-642","kind":"therapeuticClass","code":"642","name":"駆虫剤","group":"寄生動物用薬","active":true},{"id":"code-tc-649","kind":"therapeuticClass","code":"649","name":"その他の寄生動物用薬","group":"寄生動物用薬","active":true},{"id":"code-tc-690","kind":"therapeuticClass","code":"690","name":"その他の病原生物に対する医薬品","group":"その他の病原生物に対する医薬品","active":true},{"id":"code-tc-711","kind":"therapeuticClass","code":"711","name":"賦形剤","group":"調剤用薬","active":true},{"id":"code-tc-712","kind":"therapeuticClass","code":"712","name":"軟膏基剤","group":"調剤用薬","active":true},{"id":"code-tc-713","kind":"therapeuticClass","code":"713","name":"溶解剤","group":"調剤用薬","active":true},{"id":"code-tc-714","kind":"therapeuticClass","code":"714","name":"矯味、矯臭、着色剤","group":"調剤用薬","active":true},{"id":"code-tc-715","kind":"therapeuticClass","code":"715","name":"乳化剤","group":"調剤用薬","active":true},{"id":"code-tc-719","kind":"therapeuticClass","code":"719","name":"その他の調剤用薬","group":"調剤用薬","active":true},{"id":"code-tc-721","kind":"therapeuticClass","code":"721","name":"Ｘ線造影剤","group":"診断用薬（体外診断用医薬品を除く。）","active":true},{"id":"code-tc-722","kind":"therapeuticClass","code":"722","name":"機能検査用試薬","group":"診断用薬（体外診断用医薬品を除く。）","active":true},{"id":"code-tc-729","kind":"therapeuticClass","code":"729","name":"その他の診断用薬（体外診断用医薬品を除く。）","group":"診断用薬（体外診断用医薬品を除く。）","active":true},{"id":"code-tc-731","kind":"therapeuticClass","code":"731","name":"防腐剤","group":"公衆衛生用薬","active":true},{"id":"code-tc-732","kind":"therapeuticClass","code":"732","name":"防疫用殺菌消毒剤","group":"公衆衛生用薬","active":true},{"id":"code-tc-733","kind":"therapeuticClass","code":"733","name":"防虫剤","group":"公衆衛生用薬","active":true},{"id":"code-tc-734","kind":"therapeuticClass","code":"734","name":"殺虫剤","group":"公衆衛生用薬","active":true},{"id":"code-tc-735","kind":"therapeuticClass","code":"735","name":"殺そ剤","group":"公衆衛生用薬","active":true},{"id":"code-tc-739","kind":"therapeuticClass","code":"739","name":"その他の公衆衛生用薬","group":"公衆衛生用薬","active":true},{"id":"code-tc-741","kind":"therapeuticClass","code":"741","name":"一般検査用試薬","group":"体外診断用医薬品","active":true},{"id":"code-tc-742","kind":"therapeuticClass","code":"742","name":"血液検査用試薬","group":"体外診断用医薬品","active":true},{"id":"code-tc-743","kind":"therapeuticClass","code":"743","name":"生化学的検査用試薬","group":"体外診断用医薬品","active":true},{"id":"code-tc-744","kind":"therapeuticClass","code":"744","name":"免疫血清学的検査用試薬","group":"体外診断用医薬品","active":true},{"id":"code-tc-745","kind":"therapeuticClass","code":"745","name":"細菌学的検査用薬","group":"体外診断用医薬品","active":true},{"id":"code-tc-746","kind":"therapeuticClass","code":"746","name":"病理組織検査用薬","group":"体外診断用医薬品","active":true},{"id":"code-tc-747","kind":"therapeuticClass","code":"747","name":"体外診断用放射性医薬品","group":"体外診断用医薬品","active":true},{"id":"code-tc-749","kind":"therapeuticClass","code":"749","name":"その他の体外診断用医薬品","group":"体外診断用医薬品","active":true},{"id":"code-tc-799","kind":"therapeuticClass","code":"799","name":"他に分類されない治療を主目的としない医薬品","group":"その他の治療を主目的としない医薬品","active":true},{"id":"code-tc-811","kind":"therapeuticClass","code":"811","name":"あへんアルカロイド系麻薬","group":"アルカロイド系麻薬（天然麻薬）","active":true},{"id":"code-tc-812","kind":"therapeuticClass","code":"812","name":"コカアルカロイド系製剤","group":"アルカロイド系麻薬（天然麻薬）","active":true},{"id":"code-tc-819","kind":"therapeuticClass","code":"819","name":"その他のアルカロイド系麻薬（天然麻薬）","group":"アルカロイド系麻薬（天然麻薬）","active":true},{"id":"code-tc-821","kind":"therapeuticClass","code":"821","name":"合成麻薬","group":"非アルカロイド系麻薬","active":true},{"id":"code-tc-829","kind":"therapeuticClass","code":"829","name":"その他の非アルカロイド系麻薬","group":"非アルカロイド系麻薬","active":true},{"id":"code-tc-890","kind":"therapeuticClass","code":"890","name":"その他の麻薬","group":"その他の麻薬","active":true}],"sponsors":[{"id":"sp-1","sponsorType":"製造販売業者","name":"サンライズ製薬株式会社","repName":"大河内 誠","address1":"東京都中央区日本橋2-1-1","address2":"サンライズ日本橋ビル12F","manufacturerCode":"130001","contactName":"青木 亮介","contactTitle":"臨床開発部 開発推進課","telNo":"03-5200-1234","faxOrMail":"ctn-office@sunrise-pharma.co.jp","active":true}],"gaiji":[{"id":"gj-1","doctorId":"doc-2","notificationId":"nt-abc-1","targetColumn":"cr_doctor.cr_nameoriginal","originalChar":"髙","codePoint":"U+9AD9","replacementChar":"高","gaijiType":100001501,"confirmedBy":"青木 亮介","confirmedOn":"2026-03-21T11:20:00"},{"id":"gj-2","doctorId":"doc-10","notificationId":"nt-klm-1","targetColumn":"cr_doctor.cr_nameoriginal","originalChar":"德","codePoint":"U+5FB3","replacementChar":"徳","gaijiType":100001501,"confirmedBy":"青木 亮介","confirmedOn":"2025-11-06T09:05:00"}],"audit":[{"id":"au-1","at":"2026-03-25T09:12:00","who":"千葉 健一","action":"submit","entity":"治験届","entityRef":"ABC-123 計画届 #1","summary":"レビュー完了 → 提出済（GW受付待ち）"},{"id":"au-2","at":"2026-06-12T14:05:00","who":"千葉 健一","action":"submit","entity":"治験届","entityRef":"ABC-123 変更届 #2","summary":"分担医師 追加1・削除1 を提出"},{"id":"au-3","at":"2026-06-25T10:30:00","who":"千葉 健一","action":"submit","entity":"治験届","entityRef":"KLM-330 開発中止届","summary":"提出に伴いシリーズ開発状態を『開発中止』へ更新"},{"id":"au-4","at":"2026-07-08T16:40:00","who":"青木 亮介","action":"create","entity":"治験届","entityRef":"SRP-204 変更届 #3","summary":"治験使用薬の追加（併用薬）を起票"}]};
  const NOTIF_TYPE_SHORT = {"plan":"計画","change":"変更","termination":"中止","completion":"終了","devDiscontinuation":"開発中止"};
  const SPECS = {
  "CtnNotifications": {
    "titleProp": "(表示名)",
    "fields": [
      {
        "prop": "compoundId",
        "name": "CtnCompound",
        "type": "Lookup",
        "lookupList": "CtnCompounds"
      },
      {
        "prop": "notifType",
        "name": "CtnNotifType",
        "type": "Choice"
      },
      {
        "prop": "filingCount",
        "name": "CtnFilingCount",
        "type": "Number"
      },
      {
        "prop": "changeCount",
        "name": "CtnChangeCount",
        "type": "Number"
      },
      {
        "prop": "status",
        "name": "CtnStatus",
        "type": "Choice"
      },
      {
        "prop": "protocolNo",
        "name": "CtnProtocolNo",
        "type": "Text"
      },
      {
        "prop": "noteDate",
        "name": "CtnNoteDate",
        "type": "Text"
      },
      {
        "prop": "createdBy",
        "name": "CtnCreatedByUser",
        "type": "Text"
      },
      {
        "prop": "reviewedBy",
        "name": "CtnReviewedByUser",
        "type": "Text"
      },
      {
        "prop": "(集約全体)",
        "name": "CtnPayload",
        "type": "Note"
      },
      {
        "prop": "(スキーマ版)",
        "name": "CtnPayloadVersion",
        "type": "Text"
      }
    ]
  },
  "CtnCompounds": {
    "titleProp": "compoundCode",
    "fields": [
      {
        "prop": "compoundCode",
        "name": "CtnCompoundCode",
        "type": "Text"
      },
      {
        "prop": "targetCategory",
        "name": "CtnTargetCategory",
        "type": "Number"
      },
      {
        "prop": "trialKind",
        "name": "CtnTrialKind",
        "type": "Text"
      },
      {
        "prop": "initReceptNo",
        "name": "CtnInitReceptNo",
        "type": "Text"
      },
      {
        "prop": "initNoteDate",
        "name": "CtnInitNoteDate",
        "type": "Text"
      },
      {
        "prop": "devStatus",
        "name": "CtnDevStatus",
        "type": "Number"
      },
      {
        "prop": "sponsorId",
        "name": "CtnSponsor",
        "type": "Lookup",
        "lookupList": "CtnSponsors"
      },
      {
        "prop": "drugName",
        "name": "CtnDrugName",
        "type": "Text"
      },
      {
        "prop": "createdAt",
        "name": "CtnCreatedAt",
        "type": "Text"
      }
    ]
  },
  "CtnSponsors": {
    "titleProp": "name",
    "fields": [
      {
        "prop": "sponsorType",
        "name": "CtnSponsorType",
        "type": "Text"
      },
      {
        "prop": "name",
        "name": "CtnName",
        "type": "Text"
      },
      {
        "prop": "repName",
        "name": "CtnRepName",
        "type": "Text"
      },
      {
        "prop": "address1",
        "name": "CtnAddress1",
        "type": "Text"
      },
      {
        "prop": "address2",
        "name": "CtnAddress2",
        "type": "Text"
      },
      {
        "prop": "manufacturerCode",
        "name": "CtnManufacturerCode",
        "type": "Text"
      },
      {
        "prop": "contactName",
        "name": "CtnContactName",
        "type": "Text"
      },
      {
        "prop": "contactTitle",
        "name": "CtnContactTitle",
        "type": "Text"
      },
      {
        "prop": "telNo",
        "name": "CtnTelNo",
        "type": "Text"
      },
      {
        "prop": "faxOrMail",
        "name": "CtnFaxOrMail",
        "type": "Text"
      },
      {
        "prop": "overseasInfo",
        "name": "CtnOverseasInfo",
        "type": "Note"
      },
      {
        "prop": "active",
        "name": "CtnActive",
        "type": "Boolean"
      }
    ]
  },
  "CtnInstitutions": {
    "titleProp": "name",
    "fields": [
      {
        "prop": "code",
        "name": "CtnCode",
        "type": "Text"
      },
      {
        "prop": "name",
        "name": "CtnName",
        "type": "Text"
      },
      {
        "prop": "address1",
        "name": "CtnAddress1",
        "type": "Text"
      },
      {
        "prop": "address2",
        "name": "CtnAddress2",
        "type": "Text"
      },
      {
        "prop": "telNo",
        "name": "CtnTelNo",
        "type": "Text"
      },
      {
        "prop": "departments",
        "name": "CtnDepartments",
        "type": "Note"
      },
      {
        "prop": "active",
        "name": "CtnActive",
        "type": "Boolean"
      }
    ]
  },
  "CtnDoctors": {
    "titleProp": "nameFiling",
    "fields": [
      {
        "prop": "doctorNo",
        "name": "CtnDoctorNo",
        "type": "Text"
      },
      {
        "prop": "nameOriginal",
        "name": "CtnNameOriginal",
        "type": "Text"
      },
      {
        "prop": "nameFiling",
        "name": "CtnNameFiling",
        "type": "Text"
      },
      {
        "prop": "pronounce",
        "name": "CtnPronounce",
        "type": "Text"
      },
      {
        "prop": "medSchoolNo",
        "name": "CtnMedSchoolNo",
        "type": "Text"
      },
      {
        "prop": "graduationYear",
        "name": "CtnGraduationYear",
        "type": "Text"
      },
      {
        "prop": "hasGaiji",
        "name": "CtnHasGaiji",
        "type": "Boolean"
      },
      {
        "prop": "institutionId",
        "name": "CtnInstitution",
        "type": "Lookup",
        "lookupList": "CtnInstitutions"
      },
      {
        "prop": "active",
        "name": "CtnActive",
        "type": "Boolean"
      }
    ]
  },
  "CtnSiteStaff": {
    "titleProp": "name",
    "fields": [
      {
        "prop": "name",
        "name": "CtnName",
        "type": "Text"
      },
      {
        "prop": "kana",
        "name": "CtnKana",
        "type": "Text"
      },
      {
        "prop": "role",
        "name": "CtnStaffRole",
        "type": "Choice"
      },
      {
        "prop": "institutionId",
        "name": "CtnInstitution",
        "type": "Lookup",
        "lookupList": "CtnInstitutions"
      },
      {
        "prop": "telNo",
        "name": "CtnTelNo",
        "type": "Text"
      },
      {
        "prop": "mail",
        "name": "CtnMail",
        "type": "Text"
      },
      {
        "prop": "active",
        "name": "CtnActive",
        "type": "Boolean"
      }
    ]
  },
  "CtnIrbs": {
    "titleProp": "ownerName",
    "fields": [
      {
        "prop": "irbType",
        "name": "CtnIrbType",
        "type": "Number"
      },
      {
        "prop": "ownerName",
        "name": "CtnOwnerName",
        "type": "Text"
      },
      {
        "prop": "address1",
        "name": "CtnAddress1",
        "type": "Text"
      },
      {
        "prop": "address2",
        "name": "CtnAddress2",
        "type": "Text"
      },
      {
        "prop": "active",
        "name": "CtnActive",
        "type": "Boolean"
      }
    ]
  },
  "CtnCodes": {
    "titleProp": "",
    "fields": [
      {
        "prop": "kind",
        "name": "CtnCodeKind",
        "type": "Choice"
      },
      {
        "prop": "code",
        "name": "CtnCode",
        "type": "Text"
      },
      {
        "prop": "name",
        "name": "CtnName",
        "type": "Text"
      },
      {
        "prop": "group",
        "name": "CtnCodeGroup",
        "type": "Text"
      },
      {
        "prop": "active",
        "name": "CtnActive",
        "type": "Boolean"
      }
    ]
  },
  "CtnGaiji": {
    "titleProp": "(表示名)",
    "fields": [
      {
        "prop": "doctorId",
        "name": "CtnDoctor",
        "type": "Lookup",
        "lookupList": "CtnDoctors"
      },
      {
        "prop": "notificationId",
        "name": "CtnNotification",
        "type": "Lookup",
        "lookupList": "CtnNotifications"
      },
      {
        "prop": "targetColumn",
        "name": "CtnTargetColumn",
        "type": "Text"
      },
      {
        "prop": "originalChar",
        "name": "CtnOriginalChar",
        "type": "Text"
      },
      {
        "prop": "codePoint",
        "name": "CtnCodePoint",
        "type": "Text"
      },
      {
        "prop": "replacementChar",
        "name": "CtnReplacementChar",
        "type": "Text"
      },
      {
        "prop": "gaijiType",
        "name": "CtnGaijiType",
        "type": "Number"
      },
      {
        "prop": "confirmedBy",
        "name": "CtnConfirmedBy",
        "type": "Text"
      },
      {
        "prop": "confirmedOn",
        "name": "CtnConfirmedOn",
        "type": "Text"
      }
    ]
  },
  "CtnAudit": {
    "titleProp": "summary",
    "fields": [
      {
        "prop": "at",
        "name": "CtnAt",
        "type": "Text"
      },
      {
        "prop": "who",
        "name": "CtnWho",
        "type": "Text"
      },
      {
        "prop": "action",
        "name": "CtnAction",
        "type": "Choice"
      },
      {
        "prop": "entity",
        "name": "CtnEntity",
        "type": "Text"
      },
      {
        "prop": "entityRef",
        "name": "CtnEntityRef",
        "type": "Text"
      },
      {
        "prop": "summary",
        "name": "CtnSummary",
        "type": "Note"
      }
    ]
  }
};
  const ORDER = [{"list":"CtnSponsors","key":"sponsors"},{"list":"CtnInstitutions","key":"institutions"},{"list":"CtnIrbs","key":"irbs"},{"list":"CtnDoctors","key":"doctors"},{"list":"CtnSiteStaff","key":"siteStaff"},{"list":"CtnCodes","key":"codes"},{"list":"CtnCompounds","key":"compounds"},{"list":"CtnNotifications","key":"notifications"},{"list":"CtnGaiji","key":"gaiji"},{"list":"CtnAudit","key":"audit"}];
  const PAYLOAD_VERSION = "1";

  const ctx = window._spPageContextInfo;
  const web = (ctx && ctx.webAbsoluteUrl) || location.origin + location.pathname.split("/_layouts")[0];
  console.log("%cCTN Suite デモデータ投入", "font-weight:bold;font-size:14px");
  console.log("対象サイト:", web);

  const digestRes = await fetch(web + "/_api/contextinfo", {
    method: "POST",
    headers: { Accept: "application/json;odata=nometadata" },
    credentials: "same-origin",
  });
  if (!digestRes.ok) {
    console.error("フォームダイジェストを取得できませんでした。HTTP", digestRes.status);
    return;
  }
  const digest = (await digestRes.json()).FormDigestValue;

  function listApi(title) {
    return web + "/_api/web/lists/getbytitle('" + encodeURIComponent(title) + "')";
  }
  async function addItem(listTitle, fields) {
    const r = await fetch(listApi(listTitle) + "/items", {
      method: "POST",
      headers: {
        Accept: "application/json;odata=minimalmetadata",
        "Content-Type": "application/json;odata=nometadata",
        "X-RequestDigest": digest,
      },
      credentials: "same-origin",
      body: JSON.stringify(fields),
    });
    if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 400));
    return r.json();
  }
  async function mergeItem(listTitle, id, fields, etag) {
    const r = await fetch(listApi(listTitle) + "/items(" + id + ")", {
      method: "POST",
      headers: {
        Accept: "application/json;odata=minimalmetadata",
        "Content-Type": "application/json;odata=nometadata",
        "X-RequestDigest": digest,
        "X-HTTP-Method": "MERGE",
        "IF-MATCH": etag,
      },
      credentials: "same-origin",
      body: JSON.stringify(fields),
    });
    if (!r.ok) throw new Error("HTTP " + r.status + " " + (await r.text()).slice(0, 400));
  }
  async function countItems(listTitle) {
    const r = await fetch(listApi(listTitle) + "/ItemCount", {
      headers: { Accept: "application/json;odata=nometadata" },
      credentials: "same-origin",
    });
    if (!r.ok) return -1;
    return (await r.json()).value;
  }

  // --- 二重投入の防止 -----------------------------------------------------
  const existing = [];
  for (const o of ORDER) {
    const n = await countItems(o.list);
    if (n > 0) existing.push(o.list + "(" + n + "件)");
  }
  if (existing.length) {
    console.warn(
      "%c既にデータが入っています: " + existing.join(", "),
      "color:#b45309;font-weight:bold"
    );
    console.warn(
      "このスクリプトは冪等ではありません。続けると重複します。\n" +
        "投入し直す場合は各リストの項目を削除してから再実行してください。"
    );
    return;
  }

  // 旧ID(文字列) → 新ID(数値) の対応表。リスト名で引く
  const idMap = {};
  for (const o of ORDER) idMap[o.list] = {};

  /** スキーマの prop に従って1件分の列値を組み立てる */
  function buildFields(listName, rec) {
    const spec = SPECS[listName];
    const out = {};
    if (spec.titleProp && spec.titleProp.indexOf("(") !== 0) {
      out.Title = String(rec[spec.titleProp] ?? "").slice(0, 255);
    }
    for (const f of spec.fields) {
      if (f.prop.indexOf("(") === 0) continue; // "(集約全体)" 等は個別処理
      const v = rec[f.prop];
      if (f.type === "Lookup") {
        const mapped = idMap[f.lookupList][v];
        out[f.name + "Id"] = mapped === undefined ? null : mapped;
      } else if (f.type === "Boolean") {
        out[f.name] = !!v;
      } else if (f.type === "Number") {
        out[f.name] = v === undefined || v === null || v === "" ? null : Number(v);
      } else {
        out[f.name] = v === undefined || v === null ? "" : String(v);
      }
    }
    return out;
  }

  const failures = [];
  let inserted = 0;

  // --- マスタ（参照の依存順に投入）-----------------------------------------
  for (const o of ORDER) {
    if (o.list === "CtnNotifications" || o.list === "CtnGaiji" || o.list === "CtnAudit") continue;
    const records = DB[o.key] || [];
    for (const rec of records) {
      try {
        const created = await addItem(o.list, buildFields(o.list, rec));
        idMap[o.list][rec.id] = created.Id;
        inserted++;
      } catch (e) {
        failures.push({ where: o.list + " " + rec.id, message: e.message });
        console.error(o.list, rec.id, e.message);
      }
    }
    console.log("投入:", o.list, records.length, "件");
  }

  // --- 届（集約JSON内の参照IDも張り替える）--------------------------------
  // 子要素の内部ID（site.id / investigator.id / studyDrug.id）は Payload の
  // 中だけで意味を持つので、そのまま残す。張り替えるのはマスタへの参照のみ。
  function remapNotification(n) {
    const c = JSON.parse(JSON.stringify(n));
    c.compoundId = String(idMap.CtnCompounds[n.compoundId] ?? "");
    c.sponsorId = String(idMap.CtnSponsors[n.sponsorId] ?? "");
    for (const s of c.sites || []) {
      s.institutionId = String(idMap.CtnInstitutions[s.institutionId] ?? "");
      s.irbId = String(idMap.CtnIrbs[s.irbId] ?? "");
      if (s.crcStaffId) s.crcStaffId = String(idMap.CtnSiteStaff[s.crcStaffId] ?? "");
      for (const inv of s.investigators || []) {
        inv.doctorId = String(idMap.CtnDoctors[inv.doctorId] ?? "");
      }
    }
    return c;
  }

  for (const n of DB.notifications || []) {
    try {
      const mapped = remapNotification(n);
      const compound = (DB.compounds || []).find((x) => x.id === n.compoundId);
      const code = compound ? compound.compoundCode : "";
      const numbers = "届" + n.filingCount + (n.changeCount ? "/変" + n.changeCount : "");
      const title = (code + " " + numbers + " " + NOTIF_TYPE_SHORT[n.notifType] + "届").slice(0, 255);

      // 列の組み立てには「張り替え前」の n を渡す。buildFields が内部で
      // 旧ID→新ID を引くため、mapped（張り替え済み）を渡すと二重変換になり
      // ルックアップ列が null になる。Payload だけ mapped を使う。
      const base = buildFields("CtnNotifications", n);
      const created = await addItem("CtnNotifications", {
        ...base,
        Title: title,
        CtnPayload: JSON.stringify(mapped),
        CtnPayloadVersion: PAYLOAD_VERSION,
      });
      idMap.CtnNotifications[n.id] = created.Id;

      mapped.id = String(created.Id);
      await mergeItem(
        "CtnNotifications",
        created.Id,
        { CtnPayload: JSON.stringify(mapped) },
        created["odata.etag"] || '"1"'
      );
      inserted++;
    } catch (e) {
      failures.push({ where: "CtnNotifications " + n.id, message: e.message });
      console.error("CtnNotifications", n.id, e.message);
    }
  }
  console.log("投入: CtnNotifications", (DB.notifications || []).length, "件");

  // --- 外字履歴・監査ログ --------------------------------------------------
  for (const g of DB.gaiji || []) {
    try {
      const f = buildFields("CtnGaiji", g);
      f.Title = (g.originalChar + " → " + g.replacementChar).slice(0, 255);
      await addItem("CtnGaiji", f);
      inserted++;
    } catch (e) {
      failures.push({ where: "CtnGaiji " + g.id, message: e.message });
      console.error("CtnGaiji", g.id, e.message);
    }
  }
  console.log("投入: CtnGaiji", (DB.gaiji || []).length, "件");

  for (const a of DB.audit || []) {
    try {
      const f = buildFields("CtnAudit", a);
      f.Title = String(a.summary || "").slice(0, 255);
      await addItem("CtnAudit", f);
      inserted++;
    } catch (e) {
      failures.push({ where: "CtnAudit " + a.id, message: e.message });
      console.error("CtnAudit", a.id, e.message);
    }
  }
  console.log("投入: CtnAudit", (DB.audit || []).length, "件");

  console.log("%c--- 完了 ---", "font-weight:bold");
  console.log("投入件数:", inserted);
  if (failures.length) {
    console.warn("失敗", failures.length, "件");
    console.table(failures);
  } else {
    console.log("%c失敗はありません。ページを再読み込みしてください。", "color:green;font-weight:bold");
  }
})();
