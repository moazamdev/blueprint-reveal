# Install after the repository is published

Replace `YOUR_USERNAME` with the account or organization that owns the published repository. Node.js 20+ and Git are required. These commands work in PowerShell, Bash and zsh.

```sh
git clone https://github.com/YOUR_USERNAME/blueprint-reveal-skills.git
cd blueprint-reveal-skills
```

For Codex:

```sh
node scripts/install.mjs --tool codex
```

For Claude Code:

```sh
node scripts/install.mjs --tool claude-code
```

Or install both:

```sh
node scripts/install.mjs --tool both
```

No `npm install`, API key, paid service or package publication is needed to install these skills. The installer copies the skill files to personal tool directories and verifies them. It preserves an identical installation and stops before overwriting different contents.

Open the main folder of the website you want to modify in the relevant coding tool. Start a new session if necessary, then invoke `$blueprint-reveal` in Codex or `/blueprint-reveal` in Claude Code. The skill reads that website and performs the integration; installing the skill itself does not edit your website.

To keep a skill inside a particular website repository, run the installer from this skill repository with a project destination:

```sh
node scripts/install.mjs --tool both --scope project --project ../my-web-project
```

If you use a different repository name, replace it in both the clone URL and `cd` command. Downloading and extracting the repository ZIP is also supported: run the same `node scripts/install.mjs` command from the extracted folder.
