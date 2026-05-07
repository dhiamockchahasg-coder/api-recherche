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
