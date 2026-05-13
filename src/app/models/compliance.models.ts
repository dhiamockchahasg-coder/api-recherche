export interface InterpolNotice {
  forename: string;
  date_of_birth: string;
  entity_id: string;
  nationalities: string[];
  name: string;
  _links: {
    self: { href: string };
  };
}

export interface InterpolResponse {
  total: number;
  _embedded: {
    notices: InterpolNotice[];
  };
}

export interface EtalabEntreprise {
  siren: string;
  nom_complet: string;
  nature_juridique_label?: string;
  etat_administratif: string;
  dirigeants: Array<{
    nom: string;
    prenoms: string;
    role: string;
  }>;
}

export interface EtalabResponse {
  results: EtalabEntreprise[];
  total_results: number;
}

export interface WorldBankDocument {
  id: string;
  display_title: string;
  docdt: string;
  count: string;
}

export interface WorldBankResponse {
  total: number;
  documents: { [key: string]: WorldBankDocument };
}

export interface LittleSisEntity {
  id: number;
  attributes: {
    name: string;
    blurb: string;
    primary_ext: string;
    types: string[];
  };
}

export interface LittleSisResponse {
  data: LittleSisEntity[];
}

export interface CSLResult {
  id: string;
  name: string;
  alt_names: string[];
  type: string;
  source: string;
  source_information_url: string;
  addresses: Array<{
    address: string;
    city: string;
    state: string;
    country: string;
  }>;
}

export interface CSLResponse {
  total: number;
  results: CSLResult[];
}

export interface OpenCorporatesResponse {
  results: {
    total_count: number;
    companies: Array<{
      company: {
        name: string;
        company_number: string;
        jurisdiction_code: string;
        company_type: string;
        current_status: string;
      }
    }>
  }
}

export interface GelAvoirsPerson {
  id: string;
  nom: string;
  prenom: string;
  date_naissance?: string;
  lieu_naissance?: string;
  nationalite?: string;
  fondement_juridique?: string;
  motif?: string;
}

export interface GelAvoirsResponse {
  publications: GelAvoirsPerson[];
}

export interface OpenSanctionsMatchResponse {
  responses: {
    [key: string]: {
      results: Array<{
        id: string;
        schema: string;
        properties: {
          name: string[];
          topics?: string[];
          status?: string[];
          summary?: string[];
        };
        score: number;
      }>;
    };
  };
}

export interface WikidataSparqlResponse {
  results: {
    bindings: Array<{
      person: { value: string };
      personLabel: { value: string };
      positionLabel?: { value: string };
    }>;
  };
}

export interface ICIJReconcileResponse {
  [key: string]: {
    result: Array<{
      id: string;
      name: string;
      score: number;
      match: boolean;
      type: Array<{ id: string; name: string }>;
    }>;
  };
}

export interface RBEResponse {
  siren: string;
  beneficiaires_effectifs: Array<{
    nom: string;
    prenoms: string;
    date_naissance_mois: string;
    date_naissance_annee: string;
    nationalite: string;
    parts_directes: number;
    parts_indirectes: number;
  }>;
}
