pipeline {
    agent any 
    environment {
        SCANNER_HOME = tool 'sonar-scanner'
        REPOSITORY_URI = "sujalsharmaa"
        imageName = "sheetwise-ws-backend"
        imageTag = "latest"
        REPO_NAME = "Excel"
    }
    stages {
        stage('Clean Workspace') {
            steps {
                cleanWs()
            }
        }
        stage('Checkout Code') {
            steps {
                git branch: 'main', credentialsId: 'git-cred', url: 'https://github.com/sujalsharmaa/Excel.git'
            }
        }

stage('Sonarqube Analysis') {
    steps {
        dir('Excel_Backend') {
            withSonarQubeEnv('sonar-scanner') {
                withCredentials([string(credentialsId: 'sonar-token', variable: 'SONAR_TOKEN')]) {
                    sh '''
                    $SCANNER_HOME/bin/sonar-scanner \
                    -Dsonar.projectKey=hello \
                    -Dsonar.projectName=backend \
                    -Dsonar.sources=. \
                    -Dsonar.host.url=$SONAR_HOST_URL \
                    -Dsonar.token=$SONAR_TOKEN
                    '''
                }
            }
        }
    }
}

        stage('Trivy File Scan') {
            steps {
                dir('backend-nodejs') {
                    sh 'trivy fs . > trivyfs-${BUILD_NUMBER}.txt'
                }
            }
        }
        stage('Docker Image Build and Push') {
            steps {
                script {
                    def dockerRegistry = "docker.io/sujalsharma"
                    echo "Building Docker Image: ${imageName}:${imageTag}"

                    dir('Excel_Backend') {
                        sh 'docker system prune -f || true'
                        sh "docker build -t ${imageName}:${imageTag} ."

                        withCredentials([usernamePassword(credentialsId: 'docker-cred', usernameVariable: 'DOCKER_USERNAME', passwordVariable: 'DOCKER_PASSWORD')]) {
                            sh '''
                            echo "$DOCKER_PASSWORD" | docker login ${dockerRegistry} -u "$DOCKER_USERNAME" --password-stdin
                            docker tag ${imageName}:${imageTag} ${REPOSITORY_URI}/${imageName}:${imageTag}
                            docker push ${DOCKER_USERNAME}/${imageName}:${imageTag}
                            docker logout
                            '''
                        }
                    }
                }
            }
        }
        stage('Trivy Image Scan') {
            steps {
                sh "trivy image ${imageName}:${imageTag} > trivyimage-${BUILD_NUMBER}.txt"
            }
        }
        stage('Update Deployment File') {
            environment {
                GIT_REPO_NAME = "Excel"
                GIT_USER_NAME = "sujalsharmaa"
            }
            steps {
                dir('kubernetes-manifests') {
                    withCredentials([string(credentialsId: 'git-cred', variable: 'GITHUB_TOKEN')]) {
                        sh '''
                            git config user.email "sujalsharma151@gmail.com"
                            git config user.name "sujalsharmaa"
                            BUILD_NUMBER=${BUILD_NUMBER}
                            echo $BUILD_NUMBER
                            imageTag=$(grep -oP '(?<=sheetwise-ws-backend:)[^ ]+' backend-ws-deployment.yaml)
                            echo $imageTag
                            sed -i "s/${imageName}:${imageTag}/${imageName}:${BUILD_NUMBER}/" backend-ws-deployment.yaml
                            git add backend-ws-deployment.yaml
                            git commit -m "Update deployment Image to version \${imageTag}"
                            git push https://${GITHUB_TOKEN}@github.com/${GIT_USER_NAME}/${GIT_REPO_NAME} HEAD:main
                        '''
                    }
                }
            }
        }
    }
    post {
        always {
            script {
                def jobName = env.JOB_NAME
                def buildNumber = env.BUILD_NUMBER
                def pipelineStatus = currentBuild.result ?: 'UNKNOWN'
                def bannerColor = pipelineStatus.toUpperCase() == 'SUCCESS' ? 'green' : 'red'
                def textColor = 'white'

                def body = """
                    <html>
                    <body style="font-family: Arial, sans-serif; line-height: 1.6; background-color: #f9f9f9; padding: 20px;">
                        <div style="max-width: 600px; margin: auto; border: 4px solid ${bannerColor}; border-radius: 8px; overflow: hidden; background-color: #fff;">
                            <header style="background-color: ${bannerColor}; color: ${textColor}; padding: 10px; text-align: center;">
                                <h1 style="margin: 0;">${jobName}</h1>
                                <h2 style="margin: 0;">Build #${buildNumber}</h2>
                            </header>
                            <main style="padding: 20px; text-align: left;">
                                <h3>Pipeline Status: <span style="color: ${bannerColor};">${pipelineStatus.toUpperCase()}</span></h3>
                                <p>The build has completed with the status <b>${pipelineStatus.toUpperCase()}</b>. You can find the details in the Jenkins console output.</p>
                                <p style="text-align: center;">
                                    <a href="${BUILD_URL}" style="display: inline-block; padding: 10px 20px; background-color: ${bannerColor}; color: ${textColor}; text-decoration: none; border-radius: 4px;">View Console Output</a>
                                </p>
                            </main>
                            <footer style="background-color: #f0f0f0; padding: 10px; text-align: center; font-size: 12px; color: #888;">
                                <p>Sent by Jenkins CI/CD System</p>
                            </footer>
                        </div>
                    </body>
                    </html>
                """

                emailext(
                    subject: "${jobName} - Build #${buildNumber} - ${pipelineStatus.toUpperCase()}",
                    body: body,
                    to: 'sujalsharma151@gmail.com',
                    from: 'techsharma53@gmail.com',
                    replyTo: 'sujalsharma151@gmail.com',
                    mimeType: 'text/html',
                    attachmentsPattern: 'trivy-image-report.html'
                )
            }
        }
    }
}
