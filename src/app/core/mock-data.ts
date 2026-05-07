import { InterpolResponse, EtalabResponse, WorldBankResponse, LittleSisResponse, CSLResponse, OpenCorporatesResponse } from '../models/compliance.models';

export const MOCK_OPENCORPORATES: OpenCorporatesResponse = {
    results: {
        total_count: 1,
        companies: [
            {
                company: {
                    name: "OPEN DATA SYSTEMS LTD",
                    company_number: "01234567",
                    jurisdiction_code: "gb",
                    company_type: "Private Limited Company",
                    current_status: "Active"
                }
            }
        ]
    }
};

export const MOCK_CSL: CSLResponse = {
    total: 1,
    results: [
        {
            id: "CSL-999",
            name: "GLOBAL TRADE CORP (TEST MATCH)",
            alt_names: ["GTC LOGISTICS", "WORLD TRADE ENTITY"],
            type: "Entity",
            source: "SDN (OFAC)",
            source_information_url: "https://ofac.treasury.gov/specially-designated-nationals-list-sdn",
            addresses: [
                {
                    address: "123 Sanctions Ave",
                    city: "Washington",
                    state: "DC",
                    country: "US"
                }
            ]
        }
    ]
};

export const MOCK_INTERPOL: InterpolResponse = {
    total: 1,
    _embedded: {
        notices: [
            {
                forename: "Vladimir",
                date_of_birth: "1952/10/07",
                entity_id: "2023/12345",
                nationalities: ["RU"],
                name: "PUTIN",
                _links: { self: { href: "" } }
            }
        ]
    }
};

export const MOCK_ETALAB: EtalabResponse = {
    results: [
        {
            siren: "443061841",
            nom_complet: "GOOGLE FRANCE",
            etat_administratif: "A",
            dirigeants: [
                {
                    nom: "WALKER",
                    prenoms: "Kent",
                    role: "Gérant"
                }
            ]
        }
    ],
    total_results: 1
};

export const MOCK_WORLD_BANK: WorldBankResponse = {
    total: 1,
    documents: {
        "D12345": {
            id: "12345",
            display_title: "World Bank Debarred Entity - Test Case",
            docdt: "2024-01-01",
            count: "Global"
        }
    }
};

export const MOCK_LITTLESIS: LittleSisResponse = {
    data: [
        {
            id: 151,
            attributes: {
                name: "Google Inc.",
                blurb: "American multinational technology company",
                primary_ext: "Org",
                types: ["Organization", "Business"]
            }
        }
    ]
};
