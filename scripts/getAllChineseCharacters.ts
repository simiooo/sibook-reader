import { promises } from "fs";
import { fileURLToPath } from "node:url";
import path from "path";

const chineseCharacterRule = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3000-\u303f\uff00-\uffef\u2e80-\u2eff\u31c0-\u31ef\u2f00-\u2fdf\u3100-\u312f\u31a0-\u31bf]+/gum

interface Word {
    content: string;
    position: string;
    filename: string;
}

const result: Word[] = []


function main(): void {
    findChineseCharacter()
        .then(() => {
            console.log('done')
        })
        .finally(() => {
            console.log(result)
            promises.writeFile(fileURLToPath(new URL('../chineseContent.txt', import.meta.url)), JSON.stringify(result))
        })
}
main()

async function findChineseCharacter(root: string = fileURLToPath(new URL('../src', import.meta.url))) {
    let currentDir = await promises.readdir(root, { withFileTypes: true })
    for await (const file of currentDir) {
        const filePath = path.join(root, file.name);
        if (file.isDirectory()) {
            await findChineseCharacter(filePath)
        } else {
            const text = await promises.readFile(filePath, 'utf-8')

            let match;
            while ((match = chineseCharacterRule.exec(text)) !== null) {
                // console.log(match[0]);
                result.push({
                    content: match[0],
                    position: filePath,
                    filename: file.name,
                });
            }
        }
    }
}