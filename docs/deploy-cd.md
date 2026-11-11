# Automatic deploy (CD)

When a pull request is merged into `main` and the **CI** workflow passes, GitHub Actions
(`.github/workflows/deploy.yml`) connects to the VPS and runs `scripts/deploy-vps.sh` with that commit.
The script pulls the commit, rebuilds with Docker Compose, waits until
`https://<DOMAIN>/api/guest/packages` answers, and **rolls back** to the previous commit if it does not.
The workflow then checks the public site once more. A deploy can also be started by hand:
**Actions → CD - Deploy to VPS → Run workflow**.

## One-time setup

### On the VPS (as root, after the server already runs the app from `main`)
```bash
cd ~/SWP391-team-4 && git checkout main && git pull
chmod +x scripts/deploy-vps.sh
ssh-keygen -t ed25519 -N "" -C github-deploy -f ~/.ssh/github_deploy
# This key can only run the deploy script: no shell, no port forwarding.
echo "command=\"$HOME/SWP391-team-4/scripts/deploy-vps.sh\",no-port-forwarding,no-agent-forwarding,no-X11-forwarding,no-pty $(cat ~/.ssh/github_deploy.pub)" >> ~/.ssh/authorized_keys
cat ~/.ssh/github_deploy                       # -> secret DEPLOY_SSH_KEY (copy everything)
ssh-keyscan -t ed25519 <server-ip> 2>/dev/null # -> secret DEPLOY_KNOWN_HOSTS
```
After copying the private key into GitHub, delete it from the server: `rm ~/.ssh/github_deploy`.

### On GitHub: Settings → Secrets and variables → Actions → New repository secret
| Secret | Value |
| :--- | :--- |
| `DEPLOY_HOST` | server IP, e.g. `116.118.9.7` |
| `DEPLOY_DOMAIN` | site domain, e.g. `nexussport.duckdns.org` |
| `DEPLOY_SSH_KEY` | the whole private key printed above |
| `DEPLOY_KNOWN_HOSTS` | the `ssh-keyscan` line printed above |

## When something goes wrong
- The deploy log on the server: `tail -n 100 ~/deploy.log`
- Run a deploy by hand on the server: `~/SWP391-team-4/scripts/deploy-vps.sh $(git -C ~/SWP391-team-4 rev-parse origin/main)`
- To stop automatic deploys, disable the workflow in **Actions → CD - Deploy to VPS → ⋯ → Disable workflow**.
