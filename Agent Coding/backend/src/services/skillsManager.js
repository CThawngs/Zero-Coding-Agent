import { promises as fs, existsSync } from 'fs';
import { resolve, join } from 'path';

const SKILLS_DIR = resolve('../../skills'); // project root /skills

class SkillsManager {
  constructor() {
    this.skills = []; // array of { name, description, content }
  }

  async loadSkills() {
    console.log(`[Skills] Loading skills from ${SKILLS_DIR}...`);
    this.skills = [];
    if (!existsSync(SKILLS_DIR)) {
      console.log('[Skills] Skills directory not found. Creating default skills folder...');
      try {
        await fs.mkdir(SKILLS_DIR, { recursive: true });
      } catch (err) {
        console.error('[Skills] Failed to create skills dir:', err.message);
        return;
      }
    }

    try {
      const dirs = await fs.readdir(SKILLS_DIR, { withFileTypes: true });
      for (const d of dirs) {
        if (d.isDirectory()) {
          const skillMdPath = join(SKILLS_DIR, d.name, 'SKILL.md');
          if (existsSync(skillMdPath)) {
            const parsed = await this.parseSkillFile(skillMdPath, d.name);
            if (parsed) {
              this.skills.push(parsed);
              console.log(`[Skills] Loaded skill: ${parsed.name}`);
            }
          }
        }
      }
    } catch (err) {
      console.error('[Skills] Error loading skills:', err.message);
    }
  }

  async parseSkillFile(filePath, dirName) {
    try {
      const content = await fs.readFile(filePath, 'utf-8');
      
      // Parse YAML frontmatter
      const yamlRegex = /^---([\s\S]*?)---/;
      const match = content.match(yamlRegex);
      
      let name = dirName;
      let description = '';
      let body = content;

      if (match) {
        const yamlStr = match[1];
        body = content.replace(yamlRegex, '').trim();
        
        // Basic YAML parser for name and description
        const lines = yamlStr.split('\n');
        for (const line of lines) {
          const colonIdx = line.indexOf(':');
          if (colonIdx !== -1) {
            const key = line.slice(0, colonIdx).trim().toLowerCase();
            const val = line.slice(colonIdx + 1).trim();
            if (key === 'name') name = val;
            if (key === 'description') description = val;
          }
        }
      }

      return { name, description, content: body };
    } catch (err) {
      console.error(`[Skills] Failed to parse skill file at ${filePath}:`, err.message);
      return null;
    }
  }

  // Simple heuristic/keyword semantic matching for progressive disclosure
  matchSkills(userPrompt) {
    if (!userPrompt) return [];
    
    const matched = [];
    const promptLower = userPrompt.toLowerCase();

    for (const skill of this.skills) {
      const triggerWords = skill.description.toLowerCase().split(/\s+/).filter(w => w.length > 3);
      
      // Check if description trigger keywords appear in prompt
      // Or check if prompt contains skill name
      const matchesName = promptLower.includes(skill.name.toLowerCase());
      
      let keywordHits = 0;
      for (const word of triggerWords) {
        // clean word
        const cleanWord = word.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, '');
        if (cleanWord.length > 3 && promptLower.includes(cleanWord)) {
          keywordHits++;
        }
      }

      // If name matches, or keyword match rate is high enough
      if (matchesName || keywordHits >= 2) {
        matched.push(skill);
      }
    }

    return matched;
  }
}

const skillsManager = new SkillsManager();
export default skillsManager;
