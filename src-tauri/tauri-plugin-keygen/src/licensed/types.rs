use serde::Deserialize;

#[derive(Debug, Deserialize, Clone)]
pub struct LicenseResponse {
    pub meta: LicenseMeta,
    pub data: Option<LicenseData>, // NOT_FOUND has no data
}

#[derive(Debug, Deserialize, Clone)]
pub struct LicenseMeta {
    #[allow(dead_code)]
    pub ts: String,
    pub valid: bool,
    pub detail: String,
    pub code: String,
    pub scope: Option<serde_json::Value>,
}

#[derive(Debug, Deserialize, Clone)]
pub struct LicenseData {
    pub id: String,
    pub attributes: LicenseAttributes,
    pub relationships: LicenseRelationships,
}

#[derive(Debug, Deserialize, Clone)]
#[serde(rename_all = "camelCase")]
pub struct LicenseAttributes {
    #[allow(dead_code)]
    pub name: Option<String>,
    pub key: String,
    pub expiry: Option<String>,
    pub created: String,
    pub metadata: serde_json::Value,
}

#[derive(Debug, Deserialize, Clone)]
pub struct LicenseRelationships {
    pub policy: LicensePolicy,
}

#[derive(Debug, Deserialize, Clone)]
pub struct LicensePolicy {
    pub data: LicensePolicyData,
}

#[derive(Debug, Deserialize, Clone)]
pub struct LicensePolicyData {
    pub id: String,
}
