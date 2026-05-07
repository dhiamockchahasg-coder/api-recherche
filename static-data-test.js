
const STATIC_DATA = {
    openSanctions: {
        results: [
            {
                id: "qn-12345",
                schema: "Person",
                caption: "Vladimir PUTIN",
                properties: {
                    name: ["Vladimir Vladimirovich PUTIN"],
                    birthDate: ["1952-10-07"],
                    nationality: ["Russia"],
                    position: ["President of the Russian Federation"],
                    topics: ["role.pep", "sanction"]
                }
            }
        ],
        total: 1
    },
    interpol: {
        total: 1,
        _embedded: {
            notices: [
                {
                    forename: "Vladimir",
                    date_of_birth: "1952/10/07",
                    entity_id: "2023/12345",
                    nationalities: ["RU"],
                    name: "PUTIN",
                    _links: {
                        self: { href: "https://ws-public.interpol.int/notices/v1/red/2023-12345" },
                        images: { href: "https://ws-public.interpol.int/notices/v1/red/2023-12345/images" },
                        thumbnail: { href: "https://ws-public.interpol.int/notices/v1/red/2023-12345/images/1" }
                    }
                }
            ]
        }
    },
    etalab: {
        results: [
            {
                siren: "443061841",
                nom_complet: "GOOGLE FRANCE",
                nombre_etablissements: 15,
                siege: {
                    siret: "44306184100047",
                    adresse: "8 RUE DE LONDRES",
                    code_postal: "75009",
                    libelle_commune: "PARIS"
                },
                dirigeants: [
                    {
                        nom: "WALKER",
                        prenoms: "Kent",
                        date_de_naissance: "1961-01-01",
                        role: "Gérant"
                    }
                ]
            }
        ],
        total_results: 1,
        page: 1,
        per_page: 1
    },
    gelAvoirs: [
        {
            id: "GA-999",
            nom: "BIN LADEN",
            prenom: "Osama",
            date_naissance: "1957-03-10",
            lieu_naissance: "Riyadh (Saudi Arabia)",
            nationalite: "Saudi Arabia",
            fondement_juridique: "Règlement (CE) n° 881/2002",
            motif: "Terrorisme"
        }
    ]
};

function displayStaticData() {
    console.log('=== LCB-FT STATIC DATA VALIDATION ===');
    console.log('This tool demonstrates the data structures expected from the APIs.\n');

    for (const [api, data] of Object.entries(STATIC_DATA)) {
        console.log(`--- Static Data for: ${api.toUpperCase()} ---`);
        console.log(JSON.stringify(data, null, 2));
        console.log('\n' + '='.repeat(40) + '\n');
    }

    console.log('=== Display Complete ===');
}

displayStaticData();
