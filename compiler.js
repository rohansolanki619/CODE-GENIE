const express = require('express');
const path = require('path');
const app = express();
const port = 5000;
const Groq = require('groq-sdk');
const groq = new Groq({ apiKey: 'API KEY' });

app.use(express.json());
app.use(express.urlencoded({ extended : true }));



app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "index.html"));
});


async function main(inpCode) {
	const chatCompletion = await groq.chat.completions.create({
		"messages": [
			{
				"role": "user",
				"content": inpCode + `debug this code,start your answer with the corrected code, and add a comment on the code where you made changes, then explain it later by starting your explanation with: "here is the explanation". keep the answer small and no need to give another optimized code just fix this one.`
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
		} else if (ans.substring(i, i + 24) != "Here is the explanation:") {
			code += ans[i]
		} else {
			explanation += ans[i]
			flag += 1
		}

	}
	
    return [code,explanation];
}

app.post('/submit-form', async (req, res) => {
    try {
        const codeInput = req.body.code;  // Changed from req.body.Name
        const [correctedCode, explanation] = await main(codeInput);
        res.json({ code: correctedCode.trim(), explanation: explanation.trim() });
    } catch (error) {
        console.error(error);
        res.status(500).send('Error generating code');
    }
});



app.listen(port,()=>{
    console.log('Hello'+`${port}`);
});

app.use(express.static(path.join(__dirname)));
