#!/bin/bash

# Update and install essential tools
echo "Updating system and installing prerequisites..."
apt-get update -y && apt-get upgrade -y
apt-get install -y apt-transport-https ca-certificates curl software-properties-common gnupg lsb-release unzip

# Install Docker
echo "Installing Docker..."
curl -fsSL https://download.docker.com/linux/ubuntu/gpg | gpg --dearmor -o /usr/share/keyrings/docker-archive-keyring.gpg
echo "deb [arch=$(dpkg --print-architecture) signed-by=/usr/share/keyrings/docker-archive-keyring.gpg] https://download.docker.com/linux/ubuntu $(lsb_release -cs) stable" | tee /etc/apt/sources.list.d/docker.list > /dev/null
apt-get update -y
apt-get install -y docker-ce docker-ce-cli containerd.io
systemctl start docker
systemctl enable docker

# Add user to Docker group
echo "Adding user to Docker group..."
usermod -aG docker ubuntu

# Clean up unused packages
apt-get autoremove -y
apt-get clean

curl "https://awscli.amazonaws.com/awscli-exe-linux-x86_64.zip" -o "awscliv2.zip"
apt install unzip -y
unzip awscliv2.zip
./aws/install


# Verify Docker installation
echo "Docker version:"
docker --version || { echo "Docker installation failed!"; exit 1; }



git clone https://github.com/sujalsharmaa/Excel.git

cd Excel/Excel_Backend

aws s3 cp s3://my-env-bucket-terraform/auth/.env .env
chmod 600 .env

docker build -t auth .

docker run -d --env-file .env -p 80:3000 auth




# docker run -d \
#   --name zookeeper \
#   -p 2181:2181 \
#   -e ZOOKEEPER_CLIENT_PORT=2181 \
#   confluentinc/cp-zookeeper:7.0.1

# docker run -d \
#   --name kafka \
#   -p 9092:9092 \
#   -e KAFKA_BROKER_ID=1 \
#   -e KAFKA_ZOOKEEPER_CONNECT=zookeeper:2181 \
#   -e KAFKA_ADVERTISED_LISTENERS=PLAINTEXT://44.197.181.40:9092 \
#   -e KAFKA_OFFSETS_TOPIC_REPLICATION_FACTOR=1 \
#   -e KAFKA_AUTO_CREATE_TOPICS_ENABLE="true" \
#   --link zookeeper:zookeeper \
#   confluentinc/cp-kafka:7.0.1  



echo "Setup complete! You can access the application on port 80."