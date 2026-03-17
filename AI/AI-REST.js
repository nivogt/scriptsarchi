/*
 * AI Support package
 * 
 * Requires:
 *   * jArchi - https://www.archimatetool.com/blog/2018/07/02/jarchi/
 * 
 *  Gemini API Key - https://ai.google.dev/gemini-api/docs/api-key
 *  ChatGPT Key - https://platform.openai.com/docs/overview
 * 
 * Version 1: Gemini API
 * Version 2: Chat GPT + REST API usage
 * Version 3: Introduce "Engine Picker"
 * Version 4: Grok API
 * Version 4.1: Removed "Keys" from code - added to external "config.json"
 * Version 4.1.1: Added some dialogs
 * Version 5: Claude API
 * Version 5.1: Gemini 3 Pro
 * 
 * (c) 2026 Steven Mileham
 *
 */


let geminiEndpoint = "https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent";

const gptEndpoint = "https://api.openai.com/v1/responses";

const grokEndpoint = "https://api.x.ai/v1/chat/completions";

const claudeEndpoint = "https://api.anthropic.com/v1/messages";

const timeOut = 300000

console.log("Getting AI Keys");

const grokModels = ["Grok-4-Latest","Grok-3-Mini","Grok-Code-Fast-1"];
const gptModels = ["GPT-4.1", "GPT-5"];
const geminiModels = ["Gemini-3-Pro-Preview","Gemini-2.5-Flash", "Gemini-2.5-Pro", "Gemini-2.5-Flash-Lite"];
const claudeModels = ["Claude-Sonnet-4-5", "Claude-Haiku-4-5", "Claude-Opus-4-1"];

function getConfig() {
    try {
        return require(__DIR__ + "config.json");
    }
    catch (e) {
        console.error("Config not found - Creating 'config.json'");
        const grokKey = window.prompt("Please enter Grok API key","");
        const geminiKey = window.prompt("Please enter Gemini API key","");
        const gptKey = window.prompt("Please enter ChatGPT API Key","");
        const claudeKey = window.prompt("Please enter Claude API Key","");
        const theConfig = `{\n"grokKey":"${grokKey==null?"":grokKey}",\n"geminiKey":"${geminiKey==null?"":geminiKey}",\n"gptKey": "${gptKey==null?"":gptKey}",\n"claudeKey":${claudeKey==null?"":claudeKey}"\n}`
        $.fs.writeFile(__DIR__ + "config.json", theConfig);
        return JSON.parse(theConfig);
    }
}

const config = getConfig();

const gptKey = config.gptKey;
const geminiKey = config.geminiKey;
const grokKey = config.grokKey;
const claudeKey = config.claudeKey;

console.log("Loaded AI REST Package");

function listSelection(title, choices) {
    var ListSelectionDialog = Java.type("org.eclipse.ui.dialogs.ListSelectionDialog");
    var LabelProvider = Java.type('org.eclipse.jface.viewers.LabelProvider');
    var ArrayContentProvider = Java.type('org.eclipse.jface.viewers.ArrayContentProvider');
    var dialog = new ListSelectionDialog(shell, choices, ArrayContentProvider.getInstance(),
        new LabelProvider(), title);

    dialog.open();
    result = dialog.getResult();
    return result ? new String(result) : null;
}

function callApi(url, payload, engine) {

    var imports = new JavaImporter(java.net, java.util, java.lang, java.io);
    var apiResult = "";
    let result= {};

    with (imports) {

        var urlObj = new URL(url);
        var hcon = urlObj.openConnection();

        hcon.setConnectTimeout(timeOut);
        hcon.setReadTimeout(timeOut);
        hcon.setRequestMethod("POST");
        hcon.setDoOutput(true);

        // Set request headers
        hcon.setRequestProperty("Content-Type", "application/json");
        hcon.setRequestProperty("Accept", "application/json");
        hcon.setRequestProperty("Accept-Charset", "UTF-8");
        if (engine == "Gemini") {
            hcon.setRequestProperty("x-goog-api-key", geminiKey);
        }
        else if (engine == "GPT") {
            hcon.setRequestProperty("Authorization", `Bearer ${gptKey}`);
        }
        else if (engine == "Grok") {
            hcon.setRequestProperty("Authorization", `Bearer ${grokKey}`);
        }
        else if (engine == "Claude") {
            hcon.setRequestProperty("x-api-key", claudeKey);
            hcon.setRequestProperty("anthropic-version","2023-06-01");
        }

        try {
            var output = new OutputStreamWriter(hcon.getOutputStream());
            output.write(JSON.stringify(payload));
            output.flush();
            output.close();
        } catch(e) {
            console.error("Error writing POST data:");
            console.error(e);
            exit();
        }

        try {
            var reader = new BufferedReader(new InputStreamReader(hcon.getInputStream()));

            var line = reader.readLine();
            while (line != null) {
                apiResult += line + "\n";
                line = reader.readLine();
            }
            reader.close();
            result = JSON.parse(apiResult);
            switch(engine) {
                case "Gemini":
                    if (!result.candidates) {
                        console.error ("Error");
                        console.log(apiResult);
                    }
                    break;
                case "GPT":
                    if (!result.output[0]) {
                        console.error ("Error");
                        console.log(apiResult);
                    }
                    break;
                case "Grok":
                    if (!result.choices[0]) {
                        console.error ("Error");
                        console.log(apiResult);
                    }
                    break;
                default:
            }
        } catch (e) {
            console.error("HTTPS error:");
            console.error(e);
            console.error(hcon.getHeaderFields());
            exit();
        }
    }
    if (engine=="Gemini") {
        return result.candidates[0].content.parts[0].text
    }
    else if (engine=="GPT") {
        for (const num in result.output) {
            if (result.output[num].type=="message") {
                return result.output[num].content[0].text;
            }
        }
    }
    else if (engine=="Grok") {
        return result.choices[0].message.content;
    }
    else if (engine=="Claude") {
        return result.content[0].text;
    }
    return "";

}

const sendToAI = (thePrompt) => {

    let theOptions = [];
    if (gptKey) {
        theOptions.push(...gptModels);
    }
    if (geminiKey) {
        theOptions.push(...geminiModels);
    }
    if (grokKey) {
        theOptions.push(...grokModels);
    }
    if (claudeKey) {
        theOptions.push(...claudeModels);
    }
    let aiOutput = "";

    const options = listSelection("Options", theOptions);
    if (options=="" || options==null) {
        exit();
    }

    const engine = options.includes("GPT")?"GPT":options.includes("Gemini")?"Gemini":options.includes("Grok")?"Grok":"Claude";

    //console.log(thePrompt);

    if (engine == "Gemini") {
        console.log("Asking Gemini. Please Wait...");
        geminiEndpoint = `https://generativelanguage.googleapis.com/v1beta/models/${options.toLowerCase()}:generateContent`;
        let data = {
        "contents" : {
            "parts" : [
                {
                    "text": thePrompt
                }
                ]
            }
        };

        aiOutput = callApi(geminiEndpoint,data,engine);
        
    }
    else if (engine == "GPT") {
        console.log("Asking ChatGPT. Please Wait...");
        let data = {
            "model": options.toLowerCase(),
            "input": thePrompt  
            };
        aiOutput = callApi(gptEndpoint,data,engine);
    }
    else if (engine == "Grok") {
        console.log("Asking Grok. Please Wait...");
        let data = {
            "messages": [
                {
                "role": "system",
                "content": "You are a plugin to the Archi application to provide AI Analysis of ArchiMate models."
                },
                {
                "role": "user",
                "content": thePrompt
                }
            ],
            "model": options.toLowerCase(),
            "stream": false,
            "temperature": 0
            }
        aiOutput = callApi(grokEndpoint, data, engine);
    }
    else if (engine == "Claude") {
        console.log("Asking Claude. Please Wait...");
        let data = {
            "model": options.toLowerCase(),
            "max_tokens": 1024,
            "messages": [
                {
                "role": "user",
                "content": thePrompt
                }
            ]
            };
        aiOutput = callApi(claudeEndpoint,data,engine);
    }


    return `${aiOutput}\n\nGenerated by ${options} ${new Date().toLocaleString()}`;
}

module.exports=sendToAI;