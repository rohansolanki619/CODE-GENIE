const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: 'API KEY' });


let codeInputForSnippet="";
async function processCode(inpCode) {
  const chatCompletion = await groq.chat.completions.create({
    "messages": [
      {
        "role": "user",
        "content": inpCode + `add inline comments/documentation in this code, if a optimised code is possible then give the optimised code. start your answer with documented code then give optimised code starting "optimised code:" no need to write anything else`
      }
    ],
    "model": "llama-3.3-70b-versatile",
    "temperature": 1,
    "max_completion_tokens": 1024,
    "top_p": 1,
    "stream": true,
    "stop": null
  });
  let ans = "";
  for await (const chunk of chatCompletion) {
    ans += (chunk.choices[0]?.delta?.content || '');
  }
  let flag = 0;
  let code = ""
  let explanation = ""
  for (let i = 0; i < ans.length; i++) {
    if (flag != 0) {
      explanation += ans[i]
    } else if (ans.substring(i, i + 15) != "optimised code:") {
      code += ans[i]
    } else {
      explanation += ans[i]
      flag += 1
    }
  }
  return { code: code, explanation: explanation };
}

router.post('/comments-submit', async (req, res) => {
  try {
    const codeInput = req.body.code;
    const { code, explanation } = await processCode(codeInput);
    res.json({ code: code.trim(), explanation: explanation.trim() });
  codeInputForSnippet=code.trim();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing code');
  }
});

router.post('/explain-snippet-comments', async (req, res) => {
    try {
        const snippet = req.body.snippet;
        const prompt = `Explain this code snippet in simple terms explain the snippet on the context of code which is given only give explanation what that snippet does and how it does only in 4-5 lines:\n\nthis is the original code\n\n${codeInputForSnippet}\n\nthis is snippet\n\n${snippet}`;
        const chatCompletion = await groq.chat.completions.create({
            "messages": [{
                "role": "user",
                "content": prompt
            }],
            "model": "llama-3.3-70b-versatile",
            "temperature": 1,
            "max_completion_tokens": 256,
            "top_p": 1,
            "stream": true,
            "stop": null
        });
        let ans = "";
        for await (const chunk of chatCompletion) {
            ans += (chunk.choices[0]?.delta?.content || '');
        }
        res.json({ explanation: ans.trim() });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating inline explanation');
    }
});

module.exports = router;
