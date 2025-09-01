// Quick AppSync connectivity test using amplify_outputs.json
const fs = require('fs');

async function main() {
  const cfgRaw = fs.readFileSync('./amplify_outputs.json', 'utf8');
  const cfg = JSON.parse(cfgRaw);
  const { url, api_key } = cfg.data;

  const query =
    'query Generate($scoreA:Int!,$scoreB:Int!,$scoreC:Int!,$total:Int!,$highStress:Boolean!,$subscaleScores:AWSJSON!){ generateAiComment(scoreA:$scoreA,scoreB:$scoreB,scoreC:$scoreC,total:$total,highStress:$highStress,subscaleScores:$subscaleScores) }';

  const variables = {
    scoreA: 50,
    scoreB: 60,
    scoreC: 40,
    total: 150,
    highStress: true,
    subscaleScores: '{}',
  };

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-api-key': api_key,
    },
    body: JSON.stringify({ query, variables }),
  });

  const json = await res.json();
  console.log(JSON.stringify(json, null, 2));

  if (json.errors) {
    process.exitCode = 1;
  }
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});


