# ===========================================================================
# provision-lists.ps1 — CTN Suite の SharePoint リストを作成する（自動生成）
# ---------------------------------------------------------------------------
# このファイルは scripts/gen-provision.mjs が provision/ctn-lists.schema.json から
# 生成します。直接編集しないでください。
#
# 冪等です。既にあるリスト・列・グループは作り直さず、足りないものだけ足します。
# 既存列の型変更は行いません（データ損失を避けるため）。型を変えたい場合は
# 対象列を手で削除してから再実行してください。
#
# 前提: PnP.PowerShell
#   Install-Module PnP.PowerShell -Scope CurrentUser
#
# 実行例:
#   .\provision-lists.ps1 -SiteUrl 'https://<tenant>.sharepoint.com/sites/<site>' -ClientId '<Entra アプリID>'
#
# ClientId について: PnP.PowerShell 2.x 以降は対話ログインに Entra ID の
# アプリ登録が必要です。用意が無い場合は Register-PnPEntraIDAppForInteractiveLogin
# で作成できます（テナント管理者の同意が必要）。
# ===========================================================================
[CmdletBinding()]
param(
    [Parameter(Mandatory = $true)][string] $SiteUrl,
    [Parameter(Mandatory = $true)][string] $ClientId,
    # 既に Connect-PnPOnline 済みのセッションで実行する場合に指定する
    [switch] $UseExistingConnection
)

$ErrorActionPreference = 'Stop'

if (-not $UseExistingConnection) {
    Write-Host "接続中: $SiteUrl" -ForegroundColor Cyan
    Connect-PnPOnline -Url $SiteUrl -Interactive -ClientId $ClientId
}

function Test-CtnList([string] $Title) {
    try { return $null -ne (Get-PnPList -Identity $Title -ErrorAction Stop) }
    catch { return $false }
}

function Test-CtnField([string] $ListTitle, [string] $InternalName) {
    try { return $null -ne (Get-PnPField -List $ListTitle -Identity $InternalName -ErrorAction Stop) }
    catch { return $false }
}

# --- 第1段階: リストを作る（参照列の解決に先立って全リストが要る） ---------
if (Test-CtnList 'CtnNotifications') {
    Write-Host '既存: CtnNotifications' -ForegroundColor DarkGray
} else {
    Write-Host '作成: CtnNotifications (CTN 治験届)' -ForegroundColor Green
    New-PnPList -Title 'CtnNotifications' -Template GenericList -OnQuickLaunch:$false | Out-Null
}
# 一覧の表示名と説明、バージョン管理（届のスナップショット履歴として機能させる）
Set-PnPList -Identity 'CtnNotifications' -Title 'CtnNotifications' -Description '治験届。集約全体を CtnPayload(JSON) に保持し、一覧・絞り込み用に主要項目を昇格列へ投影する。正は CtnPayload。' -EnableVersioning $true | Out-Null

if (Test-CtnList 'CtnCompounds') {
    Write-Host '既存: CtnCompounds' -ForegroundColor DarkGray
} else {
    Write-Host '作成: CtnCompounds (CTN 治験成分)' -ForegroundColor Green
    New-PnPList -Title 'CtnCompounds' -Template GenericList -OnQuickLaunch:$false | Out-Null
}
# 一覧の表示名と説明、バージョン管理（届のスナップショット履歴として機能させる）
Set-PnPList -Identity 'CtnCompounds' -Title 'CtnCompounds' -Description '治験成分（シリーズ親）。届出をまたぐ共通事項を保持する。' -EnableVersioning $true | Out-Null

if (Test-CtnList 'CtnSponsors') {
    Write-Host '既存: CtnSponsors' -ForegroundColor DarkGray
} else {
    Write-Host '作成: CtnSponsors (CTN 治験届出者)' -ForegroundColor Green
    New-PnPList -Title 'CtnSponsors' -Template GenericList -OnQuickLaunch:$false | Out-Null
}
# 一覧の表示名と説明、バージョン管理（届のスナップショット履歴として機能させる）
Set-PnPList -Identity 'CtnSponsors' -Title 'CtnSponsors' -Description '治験届出者。' -EnableVersioning $true | Out-Null

if (Test-CtnList 'CtnInstitutions') {
    Write-Host '既存: CtnInstitutions' -ForegroundColor DarkGray
} else {
    Write-Host '作成: CtnInstitutions (CTN 医療機関)' -ForegroundColor Green
    New-PnPList -Title 'CtnInstitutions' -Template GenericList -OnQuickLaunch:$false | Out-Null
}
# 一覧の表示名と説明、バージョン管理（届のスナップショット履歴として機能させる）
Set-PnPList -Identity 'CtnInstitutions' -Title 'CtnInstitutions' -Description '医療機関マスタ。論理削除で履歴を保持する。' -EnableVersioning $true | Out-Null

if (Test-CtnList 'CtnDoctors') {
    Write-Host '既存: CtnDoctors' -ForegroundColor DarkGray
} else {
    Write-Host '作成: CtnDoctors (CTN 医師)' -ForegroundColor Green
    New-PnPList -Title 'CtnDoctors' -Template GenericList -OnQuickLaunch:$false | Out-Null
}
# 一覧の表示名と説明、バージョン管理（届のスナップショット履歴として機能させる）
Set-PnPList -Identity 'CtnDoctors' -Title 'CtnDoctors' -Description '医師マスタ。SharePoint の Id が不変の同一性キー（改名しても不変）。' -EnableVersioning $true | Out-Null

if (Test-CtnList 'CtnSiteStaff') {
    Write-Host '既存: CtnSiteStaff' -ForegroundColor DarkGray
} else {
    Write-Host '作成: CtnSiteStaff (CTN 現場担当)' -ForegroundColor Green
    New-PnPList -Title 'CtnSiteStaff' -Template GenericList -OnQuickLaunch:$false | Out-Null
}
# 一覧の表示名と説明、バージョン管理（届のスナップショット履歴として機能させる）
Set-PnPList -Identity 'CtnSiteStaff' -Title 'CtnSiteStaff' -Description 'CRC・SMO事務局。XML対象外だが運用で必須の連絡先。' -EnableVersioning $true | Out-Null

if (Test-CtnList 'CtnIrbs') {
    Write-Host '既存: CtnIrbs' -ForegroundColor DarkGray
} else {
    Write-Host '作成: CtnIrbs (CTN 治験審査委員会)' -ForegroundColor Green
    New-PnPList -Title 'CtnIrbs' -Template GenericList -OnQuickLaunch:$false | Out-Null
}
# 一覧の表示名と説明、バージョン管理（届のスナップショット履歴として機能させる）
Set-PnPList -Identity 'CtnIrbs' -Title 'CtnIrbs' -Description 'IRB マスタ。' -EnableVersioning $true | Out-Null

if (Test-CtnList 'CtnGaiji') {
    Write-Host '既存: CtnGaiji' -ForegroundColor DarkGray
} else {
    Write-Host '作成: CtnGaiji (CTN 外字確認履歴)' -ForegroundColor Green
    New-PnPList -Title 'CtnGaiji' -Template GenericList -OnQuickLaunch:$false | Out-Null
}
# 一覧の表示名と説明、バージョン管理（届のスナップショット履歴として機能させる）
Set-PnPList -Identity 'CtnGaiji' -Title 'CtnGaiji' -Description '外字置換マッピングの確認履歴（医師単位）。' -EnableVersioning $true | Out-Null

if (Test-CtnList 'CtnAudit') {
    Write-Host '既存: CtnAudit' -ForegroundColor DarkGray
} else {
    Write-Host '作成: CtnAudit (CTN 監査ログ)' -ForegroundColor Green
    New-PnPList -Title 'CtnAudit' -Template GenericList -OnQuickLaunch:$false | Out-Null
}
# 一覧の表示名と説明、バージョン管理（届のスナップショット履歴として機能させる）
Set-PnPList -Identity 'CtnAudit' -Title 'CtnAudit' -Description '全操作の記録。追記専用（更新・削除メソッドを実装しない）。' -EnableVersioning $true | Out-Null

# --- 第2段階: 列を足す -----------------------------------------------------
Write-Host '列: CtnNotifications' -ForegroundColor Cyan
# Title は既定列のため作成不要（用途: 例: ABC-123 届2/変1 変更届。保存時にリポジトリが組み立てる）
if (Test-CtnField 'CtnNotifications' 'CtnCompound') {
    Write-Host '  既存: CtnCompound' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnCompound' -ForegroundColor Green
    $targetId = (Get-PnPList -Identity 'CtnCompounds').Id
    $xml = '<Field Type="Lookup" DisplayName="CtnCompound" Name="CtnCompound" StaticName="CtnCompound" Required="FALSE" List="{{{0}}}" ShowField="Title" />' -f $targetId
    Add-PnPFieldFromXml -List 'CtnNotifications' -FieldXml $xml | Out-Null
}
if (Test-CtnField 'CtnNotifications' 'CtnNotifType') {
    Write-Host '  既存: CtnNotifType' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnNotifType' -ForegroundColor Green
    Add-PnPField -List 'CtnNotifications' -DisplayName 'CtnNotifType' -InternalName 'CtnNotifType' -Type Choice -Choices 'plan', 'change', 'termination', 'completion', 'devDiscontinuation' -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnNotifications' 'CtnFilingCount') {
    Write-Host '  既存: CtnFilingCount' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnFilingCount' -ForegroundColor Green
    Add-PnPField -List 'CtnNotifications' -DisplayName 'CtnFilingCount' -InternalName 'CtnFilingCount' -Type Number -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnNotifications' 'CtnChangeCount') {
    Write-Host '  既存: CtnChangeCount' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnChangeCount' -ForegroundColor Green
    Add-PnPField -List 'CtnNotifications' -DisplayName 'CtnChangeCount' -InternalName 'CtnChangeCount' -Type Number -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnNotifications' 'CtnStatus') {
    Write-Host '  既存: CtnStatus' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnStatus' -ForegroundColor Green
    Add-PnPField -List 'CtnNotifications' -DisplayName 'CtnStatus' -InternalName 'CtnStatus' -Type Choice -Choices 'draft', 'review', 'submitted' -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnNotifications' 'CtnProtocolNo') {
    Write-Host '  既存: CtnProtocolNo' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnProtocolNo' -ForegroundColor Green
    Add-PnPField -List 'CtnNotifications' -DisplayName 'CtnProtocolNo' -InternalName 'CtnProtocolNo' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnNotifications' 'CtnNoteDate') {
    Write-Host '  既存: CtnNoteDate' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnNoteDate' -ForegroundColor Green
    Add-PnPField -List 'CtnNotifications' -DisplayName 'CtnNoteDate' -InternalName 'CtnNoteDate' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnNotifications' 'CtnCreatedByUser') {
    Write-Host '  既存: CtnCreatedByUser' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnCreatedByUser' -ForegroundColor Green
    Add-PnPField -List 'CtnNotifications' -DisplayName 'CtnCreatedByUser' -InternalName 'CtnCreatedByUser' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnNotifications' 'CtnReviewedByUser') {
    Write-Host '  既存: CtnReviewedByUser' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnReviewedByUser' -ForegroundColor Green
    Add-PnPField -List 'CtnNotifications' -DisplayName 'CtnReviewedByUser' -InternalName 'CtnReviewedByUser' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnNotifications' 'CtnPayload') {
    Write-Host '  既存: CtnPayload' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnPayload' -ForegroundColor Green
    Add-PnPField -List 'CtnNotifications' -DisplayName 'CtnPayload' -InternalName 'CtnPayload' -Type Note -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnNotifications' 'CtnPayloadVersion') {
    Write-Host '  既存: CtnPayloadVersion' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnPayloadVersion' -ForegroundColor Green
    Add-PnPField -List 'CtnNotifications' -DisplayName 'CtnPayloadVersion' -InternalName 'CtnPayloadVersion' -Type Text -AddToDefaultView | Out-Null
}

Write-Host '列: CtnCompounds' -ForegroundColor Cyan
# Title は既定列のため作成不要（用途: 治験成分記号をそのまま表示名にする）
if (Test-CtnField 'CtnCompounds' 'CtnCompoundCode') {
    Write-Host '  既存: CtnCompoundCode' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnCompoundCode' -ForegroundColor Green
    Add-PnPField -List 'CtnCompounds' -DisplayName 'CtnCompoundCode' -InternalName 'CtnCompoundCode' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnCompounds' 'CtnTargetCategory') {
    Write-Host '  既存: CtnTargetCategory' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnTargetCategory' -ForegroundColor Green
    Add-PnPField -List 'CtnCompounds' -DisplayName 'CtnTargetCategory' -InternalName 'CtnTargetCategory' -Type Number -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnCompounds' 'CtnTrialKind') {
    Write-Host '  既存: CtnTrialKind' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnTrialKind' -ForegroundColor Green
    Add-PnPField -List 'CtnCompounds' -DisplayName 'CtnTrialKind' -InternalName 'CtnTrialKind' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnCompounds' 'CtnInitReceptNo') {
    Write-Host '  既存: CtnInitReceptNo' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnInitReceptNo' -ForegroundColor Green
    Add-PnPField -List 'CtnCompounds' -DisplayName 'CtnInitReceptNo' -InternalName 'CtnInitReceptNo' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnCompounds' 'CtnInitNoteDate') {
    Write-Host '  既存: CtnInitNoteDate' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnInitNoteDate' -ForegroundColor Green
    Add-PnPField -List 'CtnCompounds' -DisplayName 'CtnInitNoteDate' -InternalName 'CtnInitNoteDate' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnCompounds' 'CtnDevStatus') {
    Write-Host '  既存: CtnDevStatus' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnDevStatus' -ForegroundColor Green
    Add-PnPField -List 'CtnCompounds' -DisplayName 'CtnDevStatus' -InternalName 'CtnDevStatus' -Type Number -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnCompounds' 'CtnSponsor') {
    Write-Host '  既存: CtnSponsor' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnSponsor' -ForegroundColor Green
    $targetId = (Get-PnPList -Identity 'CtnSponsors').Id
    $xml = '<Field Type="Lookup" DisplayName="CtnSponsor" Name="CtnSponsor" StaticName="CtnSponsor" Required="FALSE" List="{{{0}}}" ShowField="Title" />' -f $targetId
    Add-PnPFieldFromXml -List 'CtnCompounds' -FieldXml $xml | Out-Null
}
if (Test-CtnField 'CtnCompounds' 'CtnDrugName') {
    Write-Host '  既存: CtnDrugName' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnDrugName' -ForegroundColor Green
    Add-PnPField -List 'CtnCompounds' -DisplayName 'CtnDrugName' -InternalName 'CtnDrugName' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnCompounds' 'CtnCreatedAt') {
    Write-Host '  既存: CtnCreatedAt' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnCreatedAt' -ForegroundColor Green
    Add-PnPField -List 'CtnCompounds' -DisplayName 'CtnCreatedAt' -InternalName 'CtnCreatedAt' -Type Text -AddToDefaultView | Out-Null
}

Write-Host '列: CtnSponsors' -ForegroundColor Cyan
# Title は既定列のため作成不要（用途: 表示名）
if (Test-CtnField 'CtnSponsors' 'CtnSponsorType') {
    Write-Host '  既存: CtnSponsorType' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnSponsorType' -ForegroundColor Green
    Add-PnPField -List 'CtnSponsors' -DisplayName 'CtnSponsorType' -InternalName 'CtnSponsorType' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSponsors' 'CtnName') {
    Write-Host '  既存: CtnName' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnName' -ForegroundColor Green
    Add-PnPField -List 'CtnSponsors' -DisplayName 'CtnName' -InternalName 'CtnName' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSponsors' 'CtnRepName') {
    Write-Host '  既存: CtnRepName' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnRepName' -ForegroundColor Green
    Add-PnPField -List 'CtnSponsors' -DisplayName 'CtnRepName' -InternalName 'CtnRepName' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSponsors' 'CtnAddress1') {
    Write-Host '  既存: CtnAddress1' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnAddress1' -ForegroundColor Green
    Add-PnPField -List 'CtnSponsors' -DisplayName 'CtnAddress1' -InternalName 'CtnAddress1' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSponsors' 'CtnAddress2') {
    Write-Host '  既存: CtnAddress2' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnAddress2' -ForegroundColor Green
    Add-PnPField -List 'CtnSponsors' -DisplayName 'CtnAddress2' -InternalName 'CtnAddress2' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSponsors' 'CtnManufacturerCode') {
    Write-Host '  既存: CtnManufacturerCode' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnManufacturerCode' -ForegroundColor Green
    Add-PnPField -List 'CtnSponsors' -DisplayName 'CtnManufacturerCode' -InternalName 'CtnManufacturerCode' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSponsors' 'CtnContactName') {
    Write-Host '  既存: CtnContactName' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnContactName' -ForegroundColor Green
    Add-PnPField -List 'CtnSponsors' -DisplayName 'CtnContactName' -InternalName 'CtnContactName' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSponsors' 'CtnContactTitle') {
    Write-Host '  既存: CtnContactTitle' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnContactTitle' -ForegroundColor Green
    Add-PnPField -List 'CtnSponsors' -DisplayName 'CtnContactTitle' -InternalName 'CtnContactTitle' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSponsors' 'CtnTelNo') {
    Write-Host '  既存: CtnTelNo' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnTelNo' -ForegroundColor Green
    Add-PnPField -List 'CtnSponsors' -DisplayName 'CtnTelNo' -InternalName 'CtnTelNo' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSponsors' 'CtnFaxOrMail') {
    Write-Host '  既存: CtnFaxOrMail' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnFaxOrMail' -ForegroundColor Green
    Add-PnPField -List 'CtnSponsors' -DisplayName 'CtnFaxOrMail' -InternalName 'CtnFaxOrMail' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSponsors' 'CtnOverseasInfo') {
    Write-Host '  既存: CtnOverseasInfo' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnOverseasInfo' -ForegroundColor Green
    Add-PnPField -List 'CtnSponsors' -DisplayName 'CtnOverseasInfo' -InternalName 'CtnOverseasInfo' -Type Note -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSponsors' 'CtnActive') {
    Write-Host '  既存: CtnActive' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnActive' -ForegroundColor Green
    Add-PnPField -List 'CtnSponsors' -DisplayName 'CtnActive' -InternalName 'CtnActive' -Type Boolean -AddToDefaultView | Out-Null
}

Write-Host '列: CtnInstitutions' -ForegroundColor Cyan
# Title は既定列のため作成不要（用途: 表示名）
if (Test-CtnField 'CtnInstitutions' 'CtnCode') {
    Write-Host '  既存: CtnCode' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnCode' -ForegroundColor Green
    Add-PnPField -List 'CtnInstitutions' -DisplayName 'CtnCode' -InternalName 'CtnCode' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnInstitutions' 'CtnName') {
    Write-Host '  既存: CtnName' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnName' -ForegroundColor Green
    Add-PnPField -List 'CtnInstitutions' -DisplayName 'CtnName' -InternalName 'CtnName' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnInstitutions' 'CtnAddress1') {
    Write-Host '  既存: CtnAddress1' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnAddress1' -ForegroundColor Green
    Add-PnPField -List 'CtnInstitutions' -DisplayName 'CtnAddress1' -InternalName 'CtnAddress1' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnInstitutions' 'CtnAddress2') {
    Write-Host '  既存: CtnAddress2' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnAddress2' -ForegroundColor Green
    Add-PnPField -List 'CtnInstitutions' -DisplayName 'CtnAddress2' -InternalName 'CtnAddress2' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnInstitutions' 'CtnTelNo') {
    Write-Host '  既存: CtnTelNo' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnTelNo' -ForegroundColor Green
    Add-PnPField -List 'CtnInstitutions' -DisplayName 'CtnTelNo' -InternalName 'CtnTelNo' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnInstitutions' 'CtnDepartments') {
    Write-Host '  既存: CtnDepartments' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnDepartments' -ForegroundColor Green
    Add-PnPField -List 'CtnInstitutions' -DisplayName 'CtnDepartments' -InternalName 'CtnDepartments' -Type Note -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnInstitutions' 'CtnActive') {
    Write-Host '  既存: CtnActive' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnActive' -ForegroundColor Green
    Add-PnPField -List 'CtnInstitutions' -DisplayName 'CtnActive' -InternalName 'CtnActive' -Type Boolean -AddToDefaultView | Out-Null
}

Write-Host '列: CtnDoctors' -ForegroundColor Cyan
# Title は既定列のため作成不要（用途: 表示名）
if (Test-CtnField 'CtnDoctors' 'CtnDoctorNo') {
    Write-Host '  既存: CtnDoctorNo' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnDoctorNo' -ForegroundColor Green
    Add-PnPField -List 'CtnDoctors' -DisplayName 'CtnDoctorNo' -InternalName 'CtnDoctorNo' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnDoctors' 'CtnNameOriginal') {
    Write-Host '  既存: CtnNameOriginal' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnNameOriginal' -ForegroundColor Green
    Add-PnPField -List 'CtnDoctors' -DisplayName 'CtnNameOriginal' -InternalName 'CtnNameOriginal' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnDoctors' 'CtnNameFiling') {
    Write-Host '  既存: CtnNameFiling' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnNameFiling' -ForegroundColor Green
    Add-PnPField -List 'CtnDoctors' -DisplayName 'CtnNameFiling' -InternalName 'CtnNameFiling' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnDoctors' 'CtnPronounce') {
    Write-Host '  既存: CtnPronounce' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnPronounce' -ForegroundColor Green
    Add-PnPField -List 'CtnDoctors' -DisplayName 'CtnPronounce' -InternalName 'CtnPronounce' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnDoctors' 'CtnMedSchoolNo') {
    Write-Host '  既存: CtnMedSchoolNo' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnMedSchoolNo' -ForegroundColor Green
    Add-PnPField -List 'CtnDoctors' -DisplayName 'CtnMedSchoolNo' -InternalName 'CtnMedSchoolNo' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnDoctors' 'CtnGraduationYear') {
    Write-Host '  既存: CtnGraduationYear' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnGraduationYear' -ForegroundColor Green
    Add-PnPField -List 'CtnDoctors' -DisplayName 'CtnGraduationYear' -InternalName 'CtnGraduationYear' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnDoctors' 'CtnHasGaiji') {
    Write-Host '  既存: CtnHasGaiji' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnHasGaiji' -ForegroundColor Green
    Add-PnPField -List 'CtnDoctors' -DisplayName 'CtnHasGaiji' -InternalName 'CtnHasGaiji' -Type Boolean -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnDoctors' 'CtnInstitution') {
    Write-Host '  既存: CtnInstitution' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnInstitution' -ForegroundColor Green
    $targetId = (Get-PnPList -Identity 'CtnInstitutions').Id
    $xml = '<Field Type="Lookup" DisplayName="CtnInstitution" Name="CtnInstitution" StaticName="CtnInstitution" Required="FALSE" List="{{{0}}}" ShowField="Title" />' -f $targetId
    Add-PnPFieldFromXml -List 'CtnDoctors' -FieldXml $xml | Out-Null
}
if (Test-CtnField 'CtnDoctors' 'CtnActive') {
    Write-Host '  既存: CtnActive' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnActive' -ForegroundColor Green
    Add-PnPField -List 'CtnDoctors' -DisplayName 'CtnActive' -InternalName 'CtnActive' -Type Boolean -AddToDefaultView | Out-Null
}

Write-Host '列: CtnSiteStaff' -ForegroundColor Cyan
# Title は既定列のため作成不要（用途: 表示名）
if (Test-CtnField 'CtnSiteStaff' 'CtnName') {
    Write-Host '  既存: CtnName' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnName' -ForegroundColor Green
    Add-PnPField -List 'CtnSiteStaff' -DisplayName 'CtnName' -InternalName 'CtnName' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSiteStaff' 'CtnKana') {
    Write-Host '  既存: CtnKana' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnKana' -ForegroundColor Green
    Add-PnPField -List 'CtnSiteStaff' -DisplayName 'CtnKana' -InternalName 'CtnKana' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSiteStaff' 'CtnStaffRole') {
    Write-Host '  既存: CtnStaffRole' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnStaffRole' -ForegroundColor Green
    Add-PnPField -List 'CtnSiteStaff' -DisplayName 'CtnStaffRole' -InternalName 'CtnStaffRole' -Type Choice -Choices 'CRC', '事務局', '薬剤部' -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSiteStaff' 'CtnInstitution') {
    Write-Host '  既存: CtnInstitution' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnInstitution' -ForegroundColor Green
    $targetId = (Get-PnPList -Identity 'CtnInstitutions').Id
    $xml = '<Field Type="Lookup" DisplayName="CtnInstitution" Name="CtnInstitution" StaticName="CtnInstitution" Required="FALSE" List="{{{0}}}" ShowField="Title" />' -f $targetId
    Add-PnPFieldFromXml -List 'CtnSiteStaff' -FieldXml $xml | Out-Null
}
if (Test-CtnField 'CtnSiteStaff' 'CtnTelNo') {
    Write-Host '  既存: CtnTelNo' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnTelNo' -ForegroundColor Green
    Add-PnPField -List 'CtnSiteStaff' -DisplayName 'CtnTelNo' -InternalName 'CtnTelNo' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSiteStaff' 'CtnMail') {
    Write-Host '  既存: CtnMail' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnMail' -ForegroundColor Green
    Add-PnPField -List 'CtnSiteStaff' -DisplayName 'CtnMail' -InternalName 'CtnMail' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnSiteStaff' 'CtnActive') {
    Write-Host '  既存: CtnActive' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnActive' -ForegroundColor Green
    Add-PnPField -List 'CtnSiteStaff' -DisplayName 'CtnActive' -InternalName 'CtnActive' -Type Boolean -AddToDefaultView | Out-Null
}

Write-Host '列: CtnIrbs' -ForegroundColor Cyan
# Title は既定列のため作成不要（用途: 表示名）
if (Test-CtnField 'CtnIrbs' 'CtnIrbType') {
    Write-Host '  既存: CtnIrbType' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnIrbType' -ForegroundColor Green
    Add-PnPField -List 'CtnIrbs' -DisplayName 'CtnIrbType' -InternalName 'CtnIrbType' -Type Number -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnIrbs' 'CtnOwnerName') {
    Write-Host '  既存: CtnOwnerName' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnOwnerName' -ForegroundColor Green
    Add-PnPField -List 'CtnIrbs' -DisplayName 'CtnOwnerName' -InternalName 'CtnOwnerName' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnIrbs' 'CtnAddress1') {
    Write-Host '  既存: CtnAddress1' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnAddress1' -ForegroundColor Green
    Add-PnPField -List 'CtnIrbs' -DisplayName 'CtnAddress1' -InternalName 'CtnAddress1' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnIrbs' 'CtnAddress2') {
    Write-Host '  既存: CtnAddress2' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnAddress2' -ForegroundColor Green
    Add-PnPField -List 'CtnIrbs' -DisplayName 'CtnAddress2' -InternalName 'CtnAddress2' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnIrbs' 'CtnActive') {
    Write-Host '  既存: CtnActive' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnActive' -ForegroundColor Green
    Add-PnPField -List 'CtnIrbs' -DisplayName 'CtnActive' -InternalName 'CtnActive' -Type Boolean -AddToDefaultView | Out-Null
}

Write-Host '列: CtnGaiji' -ForegroundColor Cyan
# Title は既定列のため作成不要（用途: originalChar → replacementChar を組み立てて入れる）
if (Test-CtnField 'CtnGaiji' 'CtnDoctor') {
    Write-Host '  既存: CtnDoctor' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnDoctor' -ForegroundColor Green
    $targetId = (Get-PnPList -Identity 'CtnDoctors').Id
    $xml = '<Field Type="Lookup" DisplayName="CtnDoctor" Name="CtnDoctor" StaticName="CtnDoctor" Required="FALSE" List="{{{0}}}" ShowField="Title" />' -f $targetId
    Add-PnPFieldFromXml -List 'CtnGaiji' -FieldXml $xml | Out-Null
}
if (Test-CtnField 'CtnGaiji' 'CtnNotification') {
    Write-Host '  既存: CtnNotification' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnNotification' -ForegroundColor Green
    $targetId = (Get-PnPList -Identity 'CtnNotifications').Id
    $xml = '<Field Type="Lookup" DisplayName="CtnNotification" Name="CtnNotification" StaticName="CtnNotification" Required="FALSE" List="{{{0}}}" ShowField="Title" />' -f $targetId
    Add-PnPFieldFromXml -List 'CtnGaiji' -FieldXml $xml | Out-Null
}
if (Test-CtnField 'CtnGaiji' 'CtnTargetColumn') {
    Write-Host '  既存: CtnTargetColumn' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnTargetColumn' -ForegroundColor Green
    Add-PnPField -List 'CtnGaiji' -DisplayName 'CtnTargetColumn' -InternalName 'CtnTargetColumn' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnGaiji' 'CtnOriginalChar') {
    Write-Host '  既存: CtnOriginalChar' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnOriginalChar' -ForegroundColor Green
    Add-PnPField -List 'CtnGaiji' -DisplayName 'CtnOriginalChar' -InternalName 'CtnOriginalChar' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnGaiji' 'CtnCodePoint') {
    Write-Host '  既存: CtnCodePoint' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnCodePoint' -ForegroundColor Green
    Add-PnPField -List 'CtnGaiji' -DisplayName 'CtnCodePoint' -InternalName 'CtnCodePoint' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnGaiji' 'CtnReplacementChar') {
    Write-Host '  既存: CtnReplacementChar' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnReplacementChar' -ForegroundColor Green
    Add-PnPField -List 'CtnGaiji' -DisplayName 'CtnReplacementChar' -InternalName 'CtnReplacementChar' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnGaiji' 'CtnGaijiType') {
    Write-Host '  既存: CtnGaijiType' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnGaijiType' -ForegroundColor Green
    Add-PnPField -List 'CtnGaiji' -DisplayName 'CtnGaijiType' -InternalName 'CtnGaijiType' -Type Number -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnGaiji' 'CtnConfirmedBy') {
    Write-Host '  既存: CtnConfirmedBy' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnConfirmedBy' -ForegroundColor Green
    Add-PnPField -List 'CtnGaiji' -DisplayName 'CtnConfirmedBy' -InternalName 'CtnConfirmedBy' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnGaiji' 'CtnConfirmedOn') {
    Write-Host '  既存: CtnConfirmedOn' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnConfirmedOn' -ForegroundColor Green
    Add-PnPField -List 'CtnGaiji' -DisplayName 'CtnConfirmedOn' -InternalName 'CtnConfirmedOn' -Type Text -AddToDefaultView | Out-Null
}

Write-Host '列: CtnAudit' -ForegroundColor Cyan
# Title は既定列のため作成不要（用途: 表示名）
if (Test-CtnField 'CtnAudit' 'CtnAt') {
    Write-Host '  既存: CtnAt' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnAt' -ForegroundColor Green
    Add-PnPField -List 'CtnAudit' -DisplayName 'CtnAt' -InternalName 'CtnAt' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnAudit' 'CtnWho') {
    Write-Host '  既存: CtnWho' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnWho' -ForegroundColor Green
    Add-PnPField -List 'CtnAudit' -DisplayName 'CtnWho' -InternalName 'CtnWho' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnAudit' 'CtnAction') {
    Write-Host '  既存: CtnAction' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnAction' -ForegroundColor Green
    Add-PnPField -List 'CtnAudit' -DisplayName 'CtnAction' -InternalName 'CtnAction' -Type Choice -Choices 'create', 'update', 'delete', 'restore', 'submit', 'approve', 'generate-xml' -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnAudit' 'CtnEntity') {
    Write-Host '  既存: CtnEntity' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnEntity' -ForegroundColor Green
    Add-PnPField -List 'CtnAudit' -DisplayName 'CtnEntity' -InternalName 'CtnEntity' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnAudit' 'CtnEntityRef') {
    Write-Host '  既存: CtnEntityRef' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnEntityRef' -ForegroundColor Green
    Add-PnPField -List 'CtnAudit' -DisplayName 'CtnEntityRef' -InternalName 'CtnEntityRef' -Type Text -AddToDefaultView | Out-Null
}
if (Test-CtnField 'CtnAudit' 'CtnSummary') {
    Write-Host '  既存: CtnSummary' -ForegroundColor DarkGray
} else {
    Write-Host '  追加: CtnSummary' -ForegroundColor Green
    Add-PnPField -List 'CtnAudit' -DisplayName 'CtnSummary' -InternalName 'CtnSummary' -Type Note -AddToDefaultView | Out-Null
}

# --- 第3段階: ロール用のサイトグループ -------------------------------------
# ロールはこのグループ所属から解決される（src/data/roleResolver.ts）。
# メンバーの追加は運用側で行うこと（このスクリプトは箱だけ作る）。
if (Get-PnPGroup -Identity 'CTN 起票担当' -ErrorAction SilentlyContinue) {
    Write-Host '既存グループ: CTN 起票担当' -ForegroundColor DarkGray
} else {
    Write-Host '作成グループ: CTN 起票担当' -ForegroundColor Green
    New-PnPGroup -Title 'CTN 起票担当' -Description '治験届の起票・編集を行う' | Out-Null
}
if (Get-PnPGroup -Identity 'CTN レビュー担当' -ErrorAction SilentlyContinue) {
    Write-Host '既存グループ: CTN レビュー担当' -ForegroundColor DarkGray
} else {
    Write-Host '作成グループ: CTN レビュー担当' -ForegroundColor Green
    New-PnPGroup -Title 'CTN レビュー担当' -Description '社内レビュー・レビュー完了（提出）・XML生成を行う。起票者との兼務は職務分離で拒否される' | Out-Null
}

Write-Host '' 
Write-Host 'プロビジョニング完了。' -ForegroundColor Green
Write-Host '次の手順:' -ForegroundColor Cyan
Write-Host '  1. 各 CTN グループへ担当者を追加する（承認者は起票者と別の人にすること）'
Write-Host '  2. Web パーツのプロパティで データソース を「SharePoint リスト」に切り替える'
