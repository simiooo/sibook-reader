import * as fs from 'fs';
import * as path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.join(fileURLToPath(import.meta.url), '..') 
console.log(__dirname)
// 指定目标文件夹路径（你可以修改为自己的路径）
const targetDir = path.resolve(__dirname,'..', 'src');

// 匹配中文的正则表达式
const chineseRegex = /[\u4e00-\u9fa5]+/g;

// 递归获取指定目录下的所有 .ts 和 .tsx 文件
const getFiles = (dir: string, fileTypes: string[]): string[] => {
  let results: string[] = [];
  const list = fs.readdirSync(dir);

  list.forEach((file) => {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);

    if (stat && stat.isDirectory()) {
      results = results.concat(getFiles(filePath, fileTypes));
    } else if (fileTypes.some(type => file.endsWith(type))) {
      results.push(filePath);
    }
  });

  return results;
};

// 查找文件中的中文字符并记录其信息
interface Match {
  text: string;
  position: number;
  file: string;
}

const findChineseInFiles = (files: string[]): Match[] => {
  let results: Match[] = [];

  files.forEach((file) => {
    const content = fs.readFileSync(file, 'utf-8');
    let match;

    while ((match = chineseRegex.exec(content)) !== null) {
      results.push({
        text: match[0],
        position: match.index,
        file: file,
      });
    }
  });

  return results;
};

// 执行查找并输出 JSON 文件
const main = () => {
  const files = getFiles(targetDir, ['.ts', '.tsx']);
  const matches = findChineseInFiles(files);

  const output = {
    results: matches,
  };

  fs.writeFileSync('chinese_matches.json', JSON.stringify(output, null, 2), 'utf-8');
  console.log('JSON 文件已生成: chinese_matches.json');
};

main();
