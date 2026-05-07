import { InterpolResponse, EtalabResponse, WorldBankResponse, LittleSisResponse } from '../models/compliance.models';

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
