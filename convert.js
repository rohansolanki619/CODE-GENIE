const express = require('express');
const router = express.Router();
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: 'API KEY' });


let codeInputForSnippet="";
async function processCode(inpCode,lang) {
  const chatCompletion = await groq.chat.completions.create({
    "messages": [
      {
        "role": "user",
        "content": inpCode + `\n convert this code to ${lang},start your answer with the code and after that give me every possible requirement to run this on my system,such as external libraries to be installed,no need to give versions or steps to how to run,just give important requirements,not small requirement mention only major library or module or package which might not be installed with compiler, if there is no other library or module or package then mention the major or popular compiler of that language compiler,do not mention IDEs,list out the requirements. start your answer with code and after that start requirement section with "Required:"`
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
    } else if (ans.substring(i, i + 9) != "Required:") {
      code += ans[i]
    } else {
      explanation += ans[i]
      flag += 1
    }
  }
  return { code: code, explanation: explanation };
}

router.post('/convert-submit', async (req, res) => {
  try {
    const codeInput = req.body.code;
    const lang = req.body.language;
    const { code, explanation } = await processCode(codeInput,lang);
    res.json({ code: code.trim(), explanation: explanation.trim() });
  codeInputForSnippet=code.trim();
  } catch (error) {
    console.error(error);
    res.status(500).send('Error processing code');
  }
});

router.post('/explain-snippet-convert', async (req, res) => {
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
