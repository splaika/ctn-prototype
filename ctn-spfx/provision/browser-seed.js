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
  const DB = {"compounds":[{"id":"cmp-abc","compoundCode":"ABC-123","targetCategory":100000100,"trialKind":"医薬品","initReceptNo":"R6薬第1234号","initNoteDate":"2026-03-25","devStatus":100000900,"sponsorId":"sp-1","drugName":"ABC-123（開発コード：リロマブ）","createdAt":"2026-03-20"},{"id":"cmp-srp","compoundCode":"SRP-204","targetCategory":100000100,"trialKind":"医薬品","initReceptNo":"R6薬第2210号","initNoteDate":"2026-01-15","devStatus":100000900,"sponsorId":"sp-1","drugName":"SRP-204（開発コード：ソラペジブ）","createdAt":"2026-01-10"},{"id":"cmp-klm","compoundCode":"KLM-330","targetCategory":100000100,"trialKind":"医薬品","initReceptNo":"R5薬第9987号","initNoteDate":"2025-11-10","devStatus":100000901,"sponsorId":"sp-1","drugName":"KLM-330（開発コード：カルメチニブ）","createdAt":"2025-11-05"}],"notifications":[{"id":"nt-abc-1","compoundId":"cmp-abc","notifType":"plan","filingCount":1,"kubun":100000200,"subj30dayReview":1,"plannedStartDate":"2026-05-01","noteDate":"2026-03-25","status":"submitted","changeLocations":[],"protocolNo":"ABC-123-001","phase":100000602,"trialType":100000701,"objectives":"関節リウマチ患者を対象としたABC-123の有効性及び安全性の検討（プラセボ対照無作為化二重盲検比較試験）","plannedSubjDrug":120,"plannedSubjTotal":240,"targetDisease":"関節リウマチ","periodStart":"2026-05-01","periodEnd":"2028-03-31","isGlobal":false,"sponsorId":"sp-1","applicBiological":0,"applicCartagena":0,"applicExpandedAccess":0,"otherCommentsProtocol":"実施計画書第2.0版（2026-03-10）に基づく。","croName":"株式会社シーアールオー・ジャパン","croAddress1":"東京都中央区日本橋1-1-1","croService":"モニタリング、データマネジメント、統計解析","remarks":"","footnote":"","studyDrugs":[{"id":"sd-abc-main","drugRole":100000400,"serialNo":1,"drugName":"ABC-123錠 25mg","plantName":"サンライズ製薬株式会社 湘南工場","plantAddress1":"神奈川県藤沢市城南4-2-1","plantAddress2":"","plantCode":"6A1234","ingredients":"1錠中 ABC-123 25mg","intendEffects":"関節リウマチ","efficacyClassCode":"3999","intendDosage":"1日1回1錠を経口投与","manufactMethod":"化学合成した ABC-123 を含有する錠剤を製剤として製する。","dosageAdmin":"1日1回1錠を経口投与する。"},{"id":"sd-abc-plc","drugRole":100000401,"serialNo":2,"drugName":"ABC-123 プラセボ錠","combCategory":100001101,"idType":"識別記号","applicationStatus":"国内未承認","adrReport":"無","plantName":"サンライズ製薬株式会社 湘南工場","plantAddress1":"神奈川県藤沢市城南4-2-1","plantAddress2":"","plantCode":"6A1234","ingredients":"有効成分を含まない","intendEffects":"（対照薬）","efficacyClassCode":"3999","intendDosage":"1日1回1錠を経口投与","manufactMethod":"被験薬と同一の外観を有する錠剤を製剤として製する。","dosageAdmin":"1日1回1錠を経口投与する。"}],"sites":[{"id":"site-abc1-a","institutionId":"inst-1","serialNo":1,"department":"リウマチ・膠原病内科","plannedSubjects":12,"irbId":"irb-1","crcStaffId":"crc-1","investigators":[{"id":"inv-1","doctorId":"doc-1","doctorRole":100000500,"serialNo":1,"changeType":100001000,"nameOriginal":"佐藤 誠一","nameFiling":"佐藤 誠一","pronounce":"さとう せいいち","medSchoolNo":"12345","graduationYear":"2001"},{"id":"inv-2","doctorId":"doc-3","doctorRole":100000501,"serialNo":2,"changeType":100001000,"nameOriginal":"鈴木 一郎","nameFiling":"鈴木 一郎","pronounce":"すずき いちろう","medSchoolNo":"34567","graduationYear":"2005"},{"id":"inv-3","doctorId":"doc-2","doctorRole":100000501,"serialNo":3,"changeType":100001000,"nameOriginal":"髙島 幸雄","nameFiling":"高島 幸雄","pronounce":"たかしま ゆきお","medSchoolNo":"23456","graduationYear":"1998"}],"quantities":[{"studyDrugId":"sd-abc-main","serialNo":1,"qtyPlanned":480},{"studyDrugId":"sd-abc-plc","serialNo":2,"qtyPlanned":480}]},{"id":"site-abc1-b","institutionId":"inst-2","serialNo":2,"department":"免疫・膠原病内科","plannedSubjects":10,"irbId":"irb-2","crcStaffId":"crc-2","investigators":[{"id":"inv-4","doctorId":"doc-5","doctorRole":100000500,"serialNo":4,"changeType":100001000,"nameOriginal":"田中 浩二","nameFiling":"田中 浩二","pronounce":"たなか こうじ","medSchoolNo":"56789","graduationYear":"2000"},{"id":"inv-5","doctorId":"doc-6","doctorRole":100000501,"serialNo":5,"changeType":100001000,"nameOriginal":"伊藤 さゆり","nameFiling":"伊藤 さゆり","pronounce":"いとう さゆり","medSchoolNo":"67890","graduationYear":"2010"}],"quantities":[{"studyDrugId":"sd-abc-main","serialNo":1,"qtyPlanned":400},{"studyDrugId":"sd-abc-plc","serialNo":2,"qtyPlanned":400}]}],"attachments":[{"id":"att-abc1-1","docType":100001200,"docName":"ABC-123-001_実施計画書_v1.0.pdf","spReference":"/CTN/ABC-123/plan/protocol_v1.0.pdf","hasBookmarks":true,"hasText":true,"attachStatus":100001300},{"id":"att-abc1-2","docType":100001201,"docName":"ABC-123_治験薬概要書_v3.pdf","spReference":"/CTN/ABC-123/plan/ib_v3.pdf","hasBookmarks":true,"hasText":true,"attachStatus":100001300}],"references":[],"inquiries":[{"id":"inq-abc1-1","inquiryDate":"2026-07-05","inquiryContent":"非臨床安全性試験（反復投与毒性）の追加データ提出について","responseDeadline":"2026-07-20","hasReplacement":false}],"createdBy":"u-a","createdAt":"2026-03-20","reviewedBy":"u-c","reviewedAt":"2026-03-24","submittedAt":"2026-03-25","xmlGeneratedAt":"2026-03-25"},{"id":"nt-abc-2","compoundId":"cmp-abc","notifType":"change","filingCount":1,"changeCount":1,"changeDate":"2026-04-10","changeReason":"分担医師（治験責任医師の異動なし）の追加・削除。","kubun":100000202,"receptNo":"R6薬第1234号","receptDate":"2026-06-12","plannedStartDate":"2026-05-01","noteDate":"2026-06-12","status":"submitted","changeLocations":[100000804],"protocolNo":"ABC-123-001","phase":100000602,"trialType":100000701,"objectives":"関節リウマチ患者を対象としたABC-123の有効性及び安全性の検討","plannedSubjDrug":120,"plannedSubjTotal":240,"targetDisease":"関節リウマチ","periodStart":"2026-05-01","periodEnd":"2028-03-31","isGlobal":false,"sponsorId":"sp-1","remarks":"分担医師1名を追加、1名を削除（異動による）。","footnote":"","studyDrugs":[{"id":"sd-abc-main","drugRole":100000400,"serialNo":1,"drugName":"ABC-123錠 25mg","plantName":"サンライズ製薬株式会社 湘南工場","plantAddress1":"神奈川県藤沢市城南4-2-1","plantAddress2":"","plantCode":"6A1234","ingredients":"1錠中 ABC-123 25mg","intendEffects":"関節リウマチ","efficacyClassCode":"3999","intendDosage":"1日1回1錠を経口投与","manufactMethod":"化学合成した ABC-123 を含有する錠剤を製剤として製する。","dosageAdmin":"1日1回1錠を経口投与する。"},{"id":"sd-abc-plc","drugRole":100000401,"serialNo":2,"drugName":"ABC-123 プラセボ錠","combCategory":100001101,"idType":"識別記号","applicationStatus":"国内未承認","adrReport":"無","plantName":"サンライズ製薬株式会社 湘南工場","plantAddress1":"神奈川県藤沢市城南4-2-1","plantAddress2":"","plantCode":"6A1234","ingredients":"有効成分を含まない","intendEffects":"（対照薬）","efficacyClassCode":"3999","intendDosage":"1日1回1錠を経口投与","manufactMethod":"被験薬と同一の外観を有する錠剤を製剤として製する。","dosageAdmin":"1日1回1錠を経口投与する。"}],"sites":[{"id":"site-abc2-a","institutionId":"inst-1","serialNo":1,"department":"リウマチ・膠原病内科","plannedSubjects":12,"irbId":"irb-1","crcStaffId":"crc-1","investigators":[{"id":"inv-6","doctorId":"doc-1","doctorRole":100000500,"serialNo":1,"changeType":100001003,"nameOriginal":"佐藤 誠一","nameFiling":"佐藤 誠一","pronounce":"さとう せいいち","medSchoolNo":"12345","graduationYear":"2001"},{"id":"inv-7","doctorId":"doc-2","doctorRole":100000501,"serialNo":2,"changeType":100001003,"nameOriginal":"髙島 幸雄","nameFiling":"高島 幸雄","pronounce":"たかしま ゆきお","medSchoolNo":"23456","graduationYear":"1998"},{"id":"inv-8","doctorId":"doc-7","doctorRole":100000501,"serialNo":3,"changeType":100001001,"nameOriginal":"渡辺 隆","nameFiling":"渡辺 隆","pronounce":"わたなべ たかし","medSchoolNo":"78901","graduationYear":"2003","changeDate":"2026-06-10","changeReason":"分担医師の追加（新規参加）"},{"id":"inv-9","doctorId":"doc-3","doctorRole":100000501,"serialNo":4,"changeType":100001002,"nameOriginal":"鈴木 一郎","nameFiling":"鈴木 一郎","pronounce":"すずき いちろう","medSchoolNo":"34567","graduationYear":"2005","changeDate":"2026-06-10","changeReason":"分担医師の異動（他施設へ転出）"}],"quantities":[{"studyDrugId":"sd-abc-main","serialNo":1,"qtyPlanned":480},{"studyDrugId":"sd-abc-plc","serialNo":2,"qtyPlanned":480}]}],"attachments":[],"references":[],"inquiries":[],"createdBy":"u-b","createdAt":"2026-06-08","reviewedBy":"u-c","reviewedAt":"2026-06-11","submittedAt":"2026-06-12","xmlGeneratedAt":"2026-06-12"},{"id":"nt-abc-3","compoundId":"cmp-abc","notifType":"completion","filingCount":1,"kubun":100000202,"receptNo":"R6薬第1234号","receptDate":"2028-04-05","noteDate":"2028-04-05","status":"review","changeLocations":[],"protocolNo":"ABC-123-001","objectives":"治験終了報告","plannedSubjDrug":120,"plannedSubjTotal":240,"targetDisease":"関節リウマチ","periodStart":"2026-05-01","periodEnd":"2028-03-31","isGlobal":false,"sponsorId":"sp-1","remarks":"全施設で予定症例登録を完了し、治験を終了した。","footnote":"","studyDrugs":[{"id":"sd-abc-main","drugRole":100000400,"serialNo":1,"drugName":"ABC-123錠 25mg","plantName":"サンライズ製薬株式会社 湘南工場","plantAddress1":"神奈川県藤沢市城南4-2-1","plantAddress2":"","plantCode":"6A1234","ingredients":"1錠中 ABC-123 25mg","intendEffects":"関節リウマチ","efficacyClassCode":"3999","intendDosage":"1日1回1錠を経口投与","manufactMethod":"化学合成した ABC-123 を含有する錠剤を製剤として製する。","dosageAdmin":"1日1回1錠を経口投与する。"},{"id":"sd-abc-plc","drugRole":100000401,"serialNo":2,"drugName":"ABC-123 プラセボ錠","combCategory":100001101,"idType":"識別記号","applicationStatus":"国内未承認","adrReport":"無","plantName":"サンライズ製薬株式会社 湘南工場","plantAddress1":"神奈川県藤沢市城南4-2-1","plantAddress2":"","plantCode":"6A1234","ingredients":"有効成分を含まない","intendEffects":"（対照薬）","efficacyClassCode":"3999","intendDosage":"1日1回1錠を経口投与","manufactMethod":"被験薬と同一の外観を有する錠剤を製剤として製する。","dosageAdmin":"1日1回1錠を経口投与する。"}],"sites":[{"id":"site-abc3-a","institutionId":"inst-1","serialNo":1,"department":"リウマチ・膠原病内科","plannedSubjects":12,"enrolledSubjects":11,"irbId":"irb-1","crcStaffId":"crc-1","investigators":[{"id":"inv-10","doctorId":"doc-1","doctorRole":100000500,"serialNo":1,"changeType":100001003,"nameOriginal":"佐藤 誠一","nameFiling":"佐藤 誠一","pronounce":"さとう せいいち","medSchoolNo":"12345","graduationYear":"2001"},{"id":"inv-11","doctorId":"doc-2","doctorRole":100000501,"serialNo":2,"changeType":100001003,"nameOriginal":"髙島 幸雄","nameFiling":"高島 幸雄","pronounce":"たかしま ゆきお","medSchoolNo":"23456","graduationYear":"1998"},{"id":"inv-12","doctorId":"doc-7","doctorRole":100000501,"serialNo":3,"changeType":100001003,"nameOriginal":"渡辺 隆","nameFiling":"渡辺 隆","pronounce":"わたなべ たかし","medSchoolNo":"78901","graduationYear":"2003"}],"quantities":[{"studyDrugId":"sd-abc-main","serialNo":1,"qtyPlanned":480,"qtySupplied":460,"qtyUsed":300,"qtyWithdrawn":120,"qtyAbrogated":40},{"studyDrugId":"sd-abc-plc","serialNo":2,"qtyPlanned":480,"qtySupplied":460,"qtyUsed":300,"qtyWithdrawn":120,"qtyAbrogated":40}]},{"id":"site-abc3-b","institutionId":"inst-2","serialNo":2,"department":"免疫・膠原病内科","plannedSubjects":10,"enrolledSubjects":9,"irbId":"irb-2","crcStaffId":"crc-2","investigators":[{"id":"inv-13","doctorId":"doc-5","doctorRole":100000500,"serialNo":4,"changeType":100001003,"nameOriginal":"田中 浩二","nameFiling":"田中 浩二","pronounce":"たなか こうじ","medSchoolNo":"56789","graduationYear":"2000"},{"id":"inv-14","doctorId":"doc-6","doctorRole":100000501,"serialNo":5,"changeType":100001003,"nameOriginal":"伊藤 さゆり","nameFiling":"伊藤 さゆり","pronounce":"いとう さゆり","medSchoolNo":"67890","graduationYear":"2010"}],"quantities":[{"studyDrugId":"sd-abc-main","serialNo":1,"qtyPlanned":400,"qtySupplied":380,"qtyUsed":250,"qtyWithdrawn":100,"qtyAbrogated":30},{"studyDrugId":"sd-abc-plc","serialNo":2,"qtyPlanned":400,"qtySupplied":380,"qtyUsed":250,"qtyWithdrawn":100,"qtyAbrogated":30}]}],"attachments":[],"references":[],"inquiries":[],"createdBy":"u-a","createdAt":"2028-03-28"},{"id":"nt-srp-1","compoundId":"cmp-srp","notifType":"plan","filingCount":1,"kubun":100000200,"subj30dayReview":1,"plannedStartDate":"2026-02-01","noteDate":"2026-01-15","status":"submitted","changeLocations":[],"protocolNo":"SRP-204-01","phase":100000600,"trialType":100000700,"objectives":"健康成人を対象としたSRP-204の薬物動態及び安全性の検討（第I相単回投与）","plannedSubjDrug":40,"plannedSubjTotal":40,"targetDisease":"潰瘍性大腸炎","periodStart":"2026-02-01","periodEnd":"2026-12-31","isGlobal":false,"sponsorId":"sp-1","remarks":"","footnote":"","studyDrugs":[{"id":"sd-srp-main","drugRole":100000400,"serialNo":1,"drugName":"SRP-204注 50mg","plantName":"サンライズ製薬株式会社 富士工場","plantAddress1":"静岡県富士市大渕2-7","plantAddress2":"","plantCode":"6A5678","ingredients":"1バイアル中 SRP-204 50mg","intendEffects":"潰瘍性大腸炎","efficacyClassCode":"2399","intendDosage":"2週間ごとに点滴静注","manufactMethod":"遺伝子組換え技術により産生した SRP-204 を含有する注射剤を製剤として製する。","dosageAdmin":"2週間ごとに1バイアルを点滴静注する。"}],"sites":[{"id":"site-srp1-a","institutionId":"inst-3","serialNo":1,"department":"消化器内科","plannedSubjects":20,"irbId":"irb-3","crcStaffId":"crc-3","smoName":"臨床開発サポート株式会社","smoAddress1":"大阪府大阪市中央区本町3-4-10","smoService":"モニタリング補助・CRC派遣","investigators":[{"id":"inv-15","doctorId":"doc-9","doctorRole":100000500,"serialNo":1,"changeType":100001000,"nameOriginal":"小林 大輔","nameFiling":"小林 大輔","pronounce":"こばやし だいすけ","medSchoolNo":"90123","graduationYear":"2004"},{"id":"inv-16","doctorId":"doc-11","doctorRole":100000501,"serialNo":2,"changeType":100001000,"nameOriginal":"加藤 めぐみ","nameFiling":"加藤 めぐみ","pronounce":"かとう めぐみ","medSchoolNo":"22345","graduationYear":"2011"}],"quantities":[{"studyDrugId":"sd-srp-main","serialNo":1,"qtyPlanned":200}]}],"attachments":[{"id":"att-srp1-1","docType":100001200,"docName":"SRP-204-01_実施計画書_v1.0.pdf","spReference":"/CTN/SRP-204/plan/protocol_v1.0.pdf","hasBookmarks":true,"hasText":true,"attachStatus":100001300}],"references":[],"inquiries":[],"createdBy":"u-a","createdAt":"2026-01-10","reviewedBy":"u-c","reviewedAt":"2026-01-14","submittedAt":"2026-01-15","xmlGeneratedAt":"2026-01-15"},{"id":"nt-srp-2","compoundId":"cmp-srp","notifType":"change","filingCount":1,"changeCount":1,"changeDate":"2026-01-05","changeReason":"対象疾患にクローン病を追加。","kubun":100000200,"receptNo":"R6薬第2210号","receptDate":"2026-04-10","plannedStartDate":"2026-02-01","noteDate":"2026-04-10","status":"submitted","changeLocations":[100000801],"protocolNo":"SRP-204-01","phase":100000600,"trialType":100000700,"objectives":"対象疾患の追加（潰瘍性大腸炎に加えクローン病を追加）","plannedSubjDrug":40,"plannedSubjTotal":40,"targetDisease":"潰瘍性大腸炎、クローン病","periodStart":"2026-02-01","periodEnd":"2026-12-31","isGlobal":false,"sponsorId":"sp-1","remarks":"対象疾患を追加。","footnote":"","studyDrugs":[{"id":"sd-srp-main","drugRole":100000400,"serialNo":1,"drugName":"SRP-204注 50mg","plantName":"サンライズ製薬株式会社 富士工場","plantAddress1":"静岡県富士市大渕2-7","plantAddress2":"","plantCode":"6A5678","ingredients":"1バイアル中 SRP-204 50mg","intendEffects":"潰瘍性大腸炎","efficacyClassCode":"2399","intendDosage":"2週間ごとに点滴静注","manufactMethod":"遺伝子組換え技術により産生した SRP-204 を含有する注射剤を製剤として製する。","dosageAdmin":"2週間ごとに1バイアルを点滴静注する。"}],"sites":[{"id":"site-srp2-a","institutionId":"inst-3","serialNo":1,"department":"消化器内科","plannedSubjects":20,"irbId":"irb-3","crcStaffId":"crc-3","investigators":[{"id":"inv-17","doctorId":"doc-9","doctorRole":100000500,"serialNo":1,"changeType":100001003,"nameOriginal":"小林 大輔","nameFiling":"小林 大輔","pronounce":"こばやし だいすけ","medSchoolNo":"90123","graduationYear":"2004"}],"quantities":[{"studyDrugId":"sd-srp-main","serialNo":1,"qtyPlanned":200}]}],"attachments":[],"references":[],"inquiries":[],"createdBy":"u-b","createdAt":"2026-04-05","reviewedBy":"u-c","reviewedAt":"2026-04-09","submittedAt":"2026-04-10","xmlGeneratedAt":"2026-04-10"},{"id":"nt-srp-3","compoundId":"cmp-srp","notifType":"change","filingCount":1,"changeCount":2,"changeDate":"2026-08-01","changeReason":"治験使用薬（併用薬）の追加。","kubun":100000201,"receptNo":"R6薬第2210号","receptDate":"","plannedStartDate":"2026-08-01","status":"draft","changeLocations":[100000803],"protocolNo":"SRP-204-01","phase":100000600,"trialType":100000700,"objectives":"治験使用薬（併用薬）の追加","plannedSubjDrug":40,"plannedSubjTotal":40,"targetDisease":"潰瘍性大腸炎、クローン病","periodStart":"2026-02-01","periodEnd":"2026-12-31","isGlobal":false,"sponsorId":"sp-1","remarks":"併用薬としてタクロリムスを追加。","footnote":"","studyDrugs":[{"id":"sd-srp-main","drugRole":100000400,"serialNo":1,"drugName":"SRP-204注 50mg","plantName":"サンライズ製薬株式会社 富士工場","plantAddress1":"静岡県富士市大渕2-7","plantAddress2":"","plantCode":"6A5678","ingredients":"1バイアル中 SRP-204 50mg","intendEffects":"潰瘍性大腸炎","efficacyClassCode":"2399","intendDosage":"2週間ごとに点滴静注","manufactMethod":"遺伝子組換え技術により産生した SRP-204 を含有する注射剤を製剤として製する。","dosageAdmin":"2週間ごとに1バイアルを点滴静注する。"},{"id":"sd-srp-adj","drugRole":100000401,"serialNo":2,"drugName":"タクロリムスカプセル（併用薬）","combCategory":100001102,"idType":"一般的名称","applicationStatus":"国内承認済","adrReport":"有","plantName":"アステラ製薬株式会社 高岡工場","plantAddress1":"富山県高岡市長慶寺700","plantAddress2":"","plantCode":"3B0011","ingredients":"1カプセル中 タクロリムス 0.5mg","intendEffects":"（併用薬）","efficacyClassCode":"3999","intendDosage":"1日2回経口投与","manufactMethod":"国内承認製剤を購入して用いる。","dosageAdmin":"1日2回1カプセルを経口投与する。"}],"sites":[{"id":"site-srp3-a","institutionId":"inst-3","serialNo":1,"department":"消化器内科","plannedSubjects":20,"irbId":"irb-3","crcStaffId":"crc-3","investigators":[{"id":"inv-18","doctorId":"doc-9","doctorRole":100000500,"serialNo":1,"changeType":100001003,"nameOriginal":"小林 大輔","nameFiling":"小林 大輔","pronounce":"こばやし だいすけ","medSchoolNo":"90123","graduationYear":"2004"}],"quantities":[{"studyDrugId":"sd-srp-main","serialNo":1,"qtyPlanned":200},{"studyDrugId":"sd-srp-adj","serialNo":2,"qtyPlanned":100}]}],"attachments":[],"references":[],"inquiries":[],"createdBy":"u-a","createdAt":"2026-07-08"},{"id":"nt-klm-1","compoundId":"cmp-klm","notifType":"plan","filingCount":1,"kubun":100000200,"subj30dayReview":1,"plannedStartDate":"2025-12-01","noteDate":"2025-11-10","status":"submitted","changeLocations":[],"protocolNo":"KLM-330-101","phase":100000600,"trialType":100000700,"objectives":"非小細胞肺癌患者を対象としたKLM-330の第I相用量漸増試験","plannedSubjDrug":30,"plannedSubjTotal":30,"targetDisease":"非小細胞肺癌","periodStart":"2025-12-01","periodEnd":"2027-06-30","isGlobal":false,"sponsorId":"sp-1","remarks":"","footnote":"","studyDrugs":[{"id":"sd-klm-main","drugRole":100000400,"serialNo":1,"drugName":"KLM-330カプセル 100mg","plantName":"サンライズ製薬株式会社 湘南工場","plantAddress1":"神奈川県藤沢市城南4-2-1","plantAddress2":"","plantCode":"6A1234","ingredients":"1カプセル中 KLM-330 100mg","intendEffects":"非小細胞肺癌","efficacyClassCode":"4291","intendDosage":"1日2回 食後経口投与"}],"sites":[{"id":"site-klm1-a","institutionId":"inst-4","serialNo":1,"department":"腫瘍内科","plannedSubjects":15,"irbId":"irb-4","crcStaffId":"crc-4","investigators":[{"id":"inv-19","doctorId":"doc-10","doctorRole":100000500,"serialNo":1,"changeType":100001000,"nameOriginal":"德永 明","nameFiling":"徳永 明","pronounce":"とくなが あきら","medSchoolNo":"11234","graduationYear":"1999"},{"id":"inv-20","doctorId":"doc-8","doctorRole":100000501,"serialNo":2,"changeType":100001000,"nameOriginal":"中村 由美","nameFiling":"中村 由美","pronounce":"なかむら ゆみ","medSchoolNo":"89012","graduationYear":"2012"}],"quantities":[{"studyDrugId":"sd-klm-main","serialNo":1,"qtyPlanned":300}]}],"attachments":[],"references":[],"inquiries":[],"createdBy":"u-a","createdAt":"2025-11-05","reviewedBy":"u-c","reviewedAt":"2025-11-09","submittedAt":"2025-11-10","xmlGeneratedAt":"2025-11-10"},{"id":"nt-klm-2","compoundId":"cmp-klm","notifType":"devDiscontinuation","filingCount":1,"kubun":100000202,"noteDate":"2026-06-25","status":"submitted","changeLocations":[],"protocolNo":"KLM-330-101","terminationDate":"2026-06-20","terminationReason":"開発方針の見直しにより本剤の開発を中止する。","objectives":"開発中止報告","targetDisease":"非小細胞肺癌","isGlobal":false,"sponsorId":"sp-1","remarks":"開発中止のため、以降の治験届出は行わない。安全性情報は継続してフォローする。","footnote":"","studyDrugs":[],"sites":[],"attachments":[],"references":[],"inquiries":[],"createdBy":"u-a","createdAt":"2026-06-22","reviewedBy":"u-c","reviewedAt":"2026-06-24","submittedAt":"2026-06-25","xmlGeneratedAt":"2026-06-25"}],"institutions":[{"id":"inst-1","code":"H001","name":"北央大学医学部附属病院","address1":"北海道札幌市北区北15条西7丁目","address2":"","telNo":"011-706-5000","active":true,"departments":["血液内科","腫瘍内科","呼吸器内科"]},{"id":"inst-2","code":"H002","name":"東京メディカルセンター","address1":"東京都目黒区東が丘2-5-1","address2":"","telNo":"03-3411-0111","active":true,"departments":["消化器内科","内科","外科"]},{"id":"inst-3","code":"H003","name":"浪速総合医療センター","address1":"大阪府大阪市住吉区東粉浜4-1-8","address2":"","telNo":"06-6672-1221","active":true,"departments":["リウマチ・膠原病内科","整形外科"]},{"id":"inst-4","code":"H004","name":"名古屋臨床研究病院","address1":"愛知県名古屋市昭和区妙見町2-9","address2":"","telNo":"052-832-1181","active":true,"departments":["腫瘍内科","乳腺外科","皮膚科"]},{"id":"inst-5","code":"H005","name":"九州先端医療病院","address1":"福岡県福岡市南区大楠3-1-1","address2":"","telNo":"092-541-4936","active":true,"departments":["神経内科","脳神経外科"]}],"doctors":[{"id":"doc-1","doctorNo":"D0001","nameOriginal":"佐藤 誠一","nameFiling":"佐藤 誠一","pronounce":"さとう せいいち","medSchoolNo":"12345","graduationYear":"2001","hasGaiji":false,"institutionId":"inst-1","active":true},{"id":"doc-2","doctorNo":"D0002","nameOriginal":"髙島 幸雄","nameFiling":"高島 幸雄","pronounce":"たかしま ゆきお","medSchoolNo":"23456","graduationYear":"1998","hasGaiji":true,"institutionId":"inst-1","active":true},{"id":"doc-3","doctorNo":"D0003","nameOriginal":"鈴木 一郎","nameFiling":"鈴木 一郎","pronounce":"すずき いちろう","medSchoolNo":"34567","graduationYear":"2005","hasGaiji":false,"institutionId":"inst-1","active":true},{"id":"doc-4","doctorNo":"D0004","nameOriginal":"山﨑 玲奈","nameFiling":"山崎 玲奈","pronounce":"やまざき れな","medSchoolNo":"45678","graduationYear":"2008","hasGaiji":true,"institutionId":"inst-3","active":true},{"id":"doc-5","doctorNo":"D0005","nameOriginal":"田中 浩二","nameFiling":"田中 浩二","pronounce":"たなか こうじ","medSchoolNo":"56789","graduationYear":"2000","hasGaiji":false,"institutionId":"inst-2","active":true},{"id":"doc-6","doctorNo":"D0006","nameOriginal":"伊藤 さゆり","nameFiling":"伊藤 さゆり","pronounce":"いとう さゆり","medSchoolNo":"67890","graduationYear":"2010","hasGaiji":false,"institutionId":"inst-2","active":true},{"id":"doc-7","doctorNo":"D0007","nameOriginal":"渡辺 隆","nameFiling":"渡辺 隆","pronounce":"わたなべ たかし","medSchoolNo":"78901","graduationYear":"2003","hasGaiji":false,"institutionId":"inst-1","active":true},{"id":"doc-8","doctorNo":"D0008","nameOriginal":"中村 由美","nameFiling":"中村 由美","pronounce":"なかむら ゆみ","medSchoolNo":"89012","graduationYear":"2012","hasGaiji":false,"institutionId":"inst-4","active":true},{"id":"doc-9","doctorNo":"D0009","nameOriginal":"小林 大輔","nameFiling":"小林 大輔","pronounce":"こばやし だいすけ","medSchoolNo":"90123","graduationYear":"2004","hasGaiji":false,"institutionId":"inst-3","active":true},{"id":"doc-10","doctorNo":"D0010","nameOriginal":"德永 明","nameFiling":"徳永 明","pronounce":"とくなが あきら","medSchoolNo":"11234","graduationYear":"1999","hasGaiji":true,"institutionId":"inst-4","active":true},{"id":"doc-11","doctorNo":"D0011","nameOriginal":"加藤 めぐみ","nameFiling":"加藤 めぐみ","pronounce":"かとう めぐみ","medSchoolNo":"22345","graduationYear":"2011","hasGaiji":false,"institutionId":"inst-3","active":true},{"id":"doc-12","doctorNo":"D0012","nameOriginal":"濵田 亮","nameFiling":"浜田 亮","pronounce":"はまだ りょう","medSchoolNo":"33456","graduationYear":"2007","hasGaiji":true,"institutionId":"inst-5","active":true}],"siteStaff":[{"id":"crc-1","name":"星野 恵","kana":"ほしの めぐみ","role":"CRC","institutionId":"inst-1","telNo":"011-706-5011","mail":"hoshino@hokuo-u.example.jp","active":true},{"id":"crc-2","name":"森田 拓也","kana":"もりた たくや","role":"CRC","institutionId":"inst-2","telNo":"03-3411-0122","mail":"morita@tmc.example.jp","active":true},{"id":"crc-3","name":"岡本 千夏","kana":"おかもと ちなつ","role":"CRC","institutionId":"inst-3","telNo":"06-6672-1233","mail":"okamoto@naniwa.example.jp","active":true},{"id":"crc-4","name":"藤井 健","kana":"ふじい けん","role":"CRC","institutionId":"inst-4","telNo":"052-832-1194","mail":"fujii@nagoya-cr.example.jp","active":true},{"id":"crc-5","name":"松本 あおい","kana":"まつもと あおい","role":"CRC","institutionId":"inst-5","telNo":"092-541-4945","mail":"matsumoto@kyushu-am.example.jp","active":true},{"id":"crc-6","name":"西村 大和","kana":"にしむら やまと","role":"事務局","institutionId":"inst-1","telNo":"011-706-5099","mail":"chiken-office@hokuo-u.example.jp","active":true}],"irbs":[{"id":"irb-1","irbType":100001400,"ownerName":"北央大学医学部附属病院 治験審査委員会","address1":"北海道札幌市北区北15条西7丁目","address2":"","active":true},{"id":"irb-2","irbType":100001400,"ownerName":"東京メディカルセンター治験審査委員会","address1":"東京都目黒区東が丘2-5-1","address2":"","active":true},{"id":"irb-3","irbType":100001401,"ownerName":"中央治験審査委員会（NPO臨床研究支援機構）","address1":"東京都千代田区神田駿河台1-8-11","address2":"","active":true},{"id":"irb-4","irbType":100001400,"ownerName":"名古屋臨床研究病院 治験審査委員会","address1":"愛知県名古屋市昭和区妙見町2-9","address2":"","active":true}],"sponsors":[{"id":"sp-1","sponsorType":"製造販売業者","name":"サンライズ製薬株式会社","repName":"大河内 誠","address1":"東京都中央区日本橋2-1-1","address2":"サンライズ日本橋ビル12F","manufacturerCode":"130001","contactName":"青木 亮介","contactTitle":"臨床開発部 開発推進課","telNo":"03-5200-1234","faxOrMail":"ctn-office@sunrise-pharma.co.jp","active":true}],"gaiji":[{"id":"gj-1","doctorId":"doc-2","notificationId":"nt-abc-1","targetColumn":"cr_doctor.cr_nameoriginal","originalChar":"髙","codePoint":"U+9AD9","replacementChar":"高","gaijiType":100001501,"confirmedBy":"青木 亮介","confirmedOn":"2026-03-21T11:20:00"},{"id":"gj-2","doctorId":"doc-10","notificationId":"nt-klm-1","targetColumn":"cr_doctor.cr_nameoriginal","originalChar":"德","codePoint":"U+5FB3","replacementChar":"徳","gaijiType":100001501,"confirmedBy":"青木 亮介","confirmedOn":"2025-11-06T09:05:00"}],"audit":[{"id":"au-1","at":"2026-03-25T09:12:00","who":"千葉 健一","action":"submit","entity":"治験届","entityRef":"ABC-123 計画届 #1","summary":"レビュー完了 → 提出済（GW受付待ち）"},{"id":"au-2","at":"2026-06-12T14:05:00","who":"千葉 健一","action":"submit","entity":"治験届","entityRef":"ABC-123 変更届 #2","summary":"分担医師 追加1・削除1 を提出"},{"id":"au-3","at":"2026-06-25T10:30:00","who":"千葉 健一","action":"submit","entity":"治験届","entityRef":"KLM-330 開発中止届","summary":"提出に伴いシリーズ開発状態を『開発中止』へ更新"},{"id":"au-4","at":"2026-07-08T16:40:00","who":"青木 亮介","action":"create","entity":"治験届","entityRef":"SRP-204 変更届 #3","summary":"治験使用薬の追加（併用薬）を起票"}]};
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
  const ORDER = [{"list":"CtnSponsors","key":"sponsors"},{"list":"CtnInstitutions","key":"institutions"},{"list":"CtnIrbs","key":"irbs"},{"list":"CtnDoctors","key":"doctors"},{"list":"CtnSiteStaff","key":"siteStaff"},{"list":"CtnCompounds","key":"compounds"},{"list":"CtnNotifications","key":"notifications"},{"list":"CtnGaiji","key":"gaiji"},{"list":"CtnAudit","key":"audit"}];
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
