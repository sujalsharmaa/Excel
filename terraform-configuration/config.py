import os
import re
import random
import string
import subprocess

def generate_random_name(prefix: str) -> str:
    suffix = ''.join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"{prefix}-{suffix}"

def update_main_tf(filepath: str, env_bucket: str, sujal_bucket: str):
    with open(filepath, 'r') as file:
        content = file.read()

    # Replace bucket name for env_bucket
    content = re.sub(
        r'(resource\s+"aws_s3_bucket"\s+"env_bucket"\s*{[^}]*?bucket\s*=\s*")[^"]+(")',
        rf'\1{env_bucket}\2',
        content,
        flags=re.DOTALL,
    )

    # Replace bucket name for sujal910992
    content = re.sub(
        r'(resource\s+"aws_s3_bucket"\s+"sujal910992"\s*{[^}]*?bucket\s*=\s*")[^"]+(")',
        rf'\1{sujal_bucket}\2',
        content,
        flags=re.DOTALL,
    )

    with open(filepath, 'w') as file:
        file.write(content)

    print(f"✅ Updated main.tf with: {env_bucket}, {sujal_bucket}")

def update_env_file(filepath: str, sujal_bucket: str):
    if not os.path.exists(filepath):
        return

    with open(filepath, 'r') as file:
        content = file.read()

    content = re.sub(r'(S3_BUCKET_NAME\s*=\s*)(.+)', rf'\1{sujal_bucket}', content)

    with open(filepath, 'w') as file:
        file.write(content)

    print(f"✅ Updated .env with S3_BUCKET_NAME={sujal_bucket}")

def update_script_or_tf_with_cp(filepath: str, new_prefix: str):
    if not os.path.exists(filepath):
        print(f"❌ File does not exist: {filepath}")
        return

    with open(filepath, 'r') as file:
        content = file.read()

    # Replace the full s3 path after 'aws s3 cp s3://...'
    # This pattern captures: aws s3 cp s3://<bucket and key>
    content = re.sub(
        r'(aws\s+s3\s+cp\s+s3://)([^/\s]+)(/[\S]*)',
        rf'\1{new_prefix}\3',
        content
    )

    with open(filepath, 'w') as file:
        file.write(content)

    print(f"✅ Updated aws s3 cp command in {filepath}")


def update_aws_credentials(path: str, region: str = "us-east-1"):
    print("Enter the AWS Access Key ID:")
    access_key_id = input().strip()

    print("Enter the AWS Secret Access Key:")
    secret_access_key = input().strip()

    # Read existing .env or create new
    if not os.path.exists(path):
        print("⚠️ .env file doesn't exist. Creating new one.")
        content = ""
    else:
        with open(path, 'r') as file:
            content = file.read()

    # Add or update accesskeyid
    if re.search(r'(?i)^accesskeyid\s*=.*$', content, re.MULTILINE):
        content = re.sub(r'(?i)^accesskeyid\s*=.*$', f'accesskeyid={access_key_id}', content, flags=re.MULTILINE)
    else:
        content += f'\naccesskeyid={access_key_id}'

    # Add or update secretaccesskey
    if re.search(r'(?i)^secretaccesskey\s*=.*$', content, re.MULTILINE):
        content = re.sub(r'(?i)^secretaccesskey\s*=.*$', f'secretaccesskey={secret_access_key}', content, flags=re.MULTILINE)
    else:
        content += f'\nsecretaccesskey={secret_access_key}'

    with open(path, 'w') as file:
        file.write(content)

    print("✅ .env file updated with AWS credentials.")

    # Configure AWS CLI
    try:
        subprocess.run(["aws", "configure", "set", "aws_access_key_id", access_key_id], check=True)
        subprocess.run(["aws", "configure", "set", "aws_secret_access_key", secret_access_key], check=True)
        subprocess.run(["aws", "configure", "set", "default.region", region], check=True)
        print("✅ AWS CLI configured successfully.")
    except subprocess.CalledProcessError as e:
        print(f"❌ AWS CLI configuration failed: {e}")


if __name__ == "__main__":
    # Generate new names
    new_env_bucket = generate_random_name("my-env-bucket")
    new_sujal_bucket = generate_random_name("sujal")

    # Update main.tf
    update_main_tf("./main.tf", new_env_bucket, new_sujal_bucket)

    # Update .env
    update_env_file("../Excel_Backend/.env", new_sujal_bucket)
    update_env_file("../Excel_Backend_Nodejs_WS/.env", new_sujal_bucket)

    # Update any shell or tf file containing aws s3 cp...
    update_script_or_tf_with_cp("./sheetwise-auth-backend.sh", new_env_bucket)
    update_script_or_tf_with_cp("./sheetwise-ws-backend.sh", new_env_bucket)  # optional

    update_aws_credentials("../Excel_Backend/.env","us-east-1")
    update_aws_credentials("../Excel_Backend_Nodejs_WS/.env","us-east-1")

