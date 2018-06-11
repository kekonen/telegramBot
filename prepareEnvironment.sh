sudo apt update;
sudo apt-get install     apt-transport-https     ca-certificates     curl     software-properties-common;
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo apt-key add -;
sudo apt-key fingerprint 0EBFCD88;
sudo add-apt-repository    "deb [arch=amd64] https://download.docker.com/linux/ubuntu \
	$(lsb_release -cs) \
	edge";
sudo apt update;
sudo apt-get install docker-ce;
apt-cache madison docker-ce;
sudo apt-get install docker-ce;
docker -v;
sudo apt install docker-compose;
sudo apt install nodejs npm;
sudo apt install build-essential;
curl -sL https://raw.githubusercontent.com/creationix/nvm/v0.33.11/install.sh -o install_nvm.sh;
bash install_nvm.sh;
source ~/.profile;
nvm install 10.4.0;
npm -v;
node -v;