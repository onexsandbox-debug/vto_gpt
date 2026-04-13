import fetch from 'node-fetch'

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Only POST allowed' })
  }

  try {
    const { userInput, apiKey } = req.body

    if (!apiKey) {
      return res.status(400).json({ error: 'apiKey is required in payload' })
    }

    const prompt = `Please extract product search filters from the user utterance ${userInput}.The allowed fields are name,gender,color,size,minPrice,maxPrice,popularity,category.Field definitions:name is product type or pattern such as polo,stripe,crewneck,plain.gender is men or women.color is any mentioned color.size is S,M,L,XL,XXL,XXXL.minPrice is numeric if user indicates above,premium,expensive.maxPrice is numeric if user indicates under,below,cheap.popularity is numeric between 0.00 and 1.00 where popular,trending,best maps to 0.80 to 1.00.category defaults to tshirt.Extraction rules:cheap,under,below map to maxPrice.above,premium,expensive map to minPrice.between X and Y maps to minPrice and maxPrice.popular,trending,best selling map to popularity 0.80 to 1.00.infer gender from men,women,boys,girls.infer name from product type or pattern such as striped shirt maps to stripe.handle fuzzy words like plo→polo,strpe→stripe,tshrt→tshirt,blck→black.infer color and size if present.if any field is missing return null.Return output strictly in JSON format with keys name,gender,color,size,minPrice,maxPrice,popularity,category.Do not include any explanation.`

    const response = await fetch('https://chatgpt-best-price.p.rapidapi.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-rapidapi-host': 'chatgpt-best-price.p.rapidapi.com',
        'x-rapidapi-key': apiKey   // 🔥 dynamic from payload
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: [
          {
            role: 'user',
            content: prompt
          }
        ]
      })
    })

    const data = await response.json()

    const content = data.choices?.[0]?.message?.content

    let parsed = {}

    try {
      parsed = JSON.parse(content)
    } catch (e) {
      return res.status(500).json({
        error: 'Invalid JSON from model',
        raw: content
      })
    }

    return res.status(200).json({
      success: true,
      filters: parsed
    })

  } catch (err) {
    return res.status(500).json({
      error: err.message
    })
  }
}
