# hhtcc
## Installation
- Jre 11
- Nodejs 12.4.0
## How to deploy
- `gradle distZip`
- `gradle installDist`
- `cp -rf build/install/hhtcc src/main/electron/hhtcc`
- `cd src/main/electron && npm run electron:windows`
## How to run
- `./gradlew --configure-on-demand -x check run`
- `cd src/main/electron && npm start`