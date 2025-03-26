#file1

# VPC
resource "aws_vpc" "main" {
  cidr_block           = "10.0.0.0/16"
  enable_dns_hostnames = true
  enable_dns_support   = true
  tags = {
    Name        = local.env
    Environment = local.env
  }
}

# Internet Gateway
resource "aws_internet_gateway" "igw" {
  vpc_id = aws_vpc.main.id
  tags = {
    Name        = "${local.env}-igw"
    Environment = local.env
  }
}

# Public and Private Subnets
resource "aws_subnet" "private_zone1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.0.0/19"
  availability_zone = local.zone1
  tags = {
    Name        = "${local.env}-private-${local.zone1}"
    Environment = local.env
    "kubernetes.io/role/internal-elb" = "1"
  }
}

resource "aws_subnet" "private_zone2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.32.0/19"
  availability_zone = local.zone2
  tags = {
    Name        = "${local.env}-private-${local.zone2}"
    Environment = local.env
    "kubernetes.io/role/internal-elb" = "1"
  }
}

resource "aws_subnet" "public_zone1" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.64.0/19"
  availability_zone = local.zone1
  tags = {
    Name        = "${local.env}-public-${local.zone1}"
    Environment = local.env
    "kubernetes.io/role/elb" = "1"
  }
}

resource "aws_subnet" "public_zone2" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = "10.0.96.0/19"
  availability_zone = local.zone2
  tags = {
    Name        = "${local.env}-public-${local.zone2}"
    Environment = local.env
    "kubernetes.io/role/elb" = "1"
  }
}

# Elastic IP for NAT Gateway
resource "aws_eip" "nat" {
  domain = "vpc"
  tags = {
    Name        = "${local.env}-nat"
    Environment = local.env
  }
}

# NAT Gateway
resource "aws_nat_gateway" "nat" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public_zone1.id
  tags = {
    Name        = "${local.env}-nat"
    Environment = local.env
  }
}

# Second NAT Gateway for redundancy
resource "aws_eip" "nat_zone2" {
  domain = "vpc"
  tags = {
    Name        = "${local.env}-nat-zone2"
    Environment = local.env
  }
}

resource "aws_nat_gateway" "nat_zone2" {
  allocation_id = aws_eip.nat_zone2.id
  subnet_id     = aws_subnet.public_zone2.id
  tags = {
    Name        = "${local.env}-nat-zone2"
    Environment = local.env
  }
}

# Route Tables and Associations
resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.nat.id
  }
  tags = {
    Name        = "${local.env}-private"
    Environment = local.env
  }
}

resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id
  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.igw.id
  }
  tags = {
    Name        = "${local.env}-public"
    Environment = local.env
  }
}

resource "aws_route_table_association" "private_zone1" {
  subnet_id      = aws_subnet.private_zone1.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "private_zone2" {
  subnet_id      = aws_subnet.private_zone2.id
  route_table_id = aws_route_table.private.id
}

resource "aws_route_table_association" "public_zone1" {
  subnet_id      = aws_subnet.public_zone1.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table_association" "public_zone2" {
  subnet_id      = aws_subnet.public_zone2.id
  route_table_id = aws_route_table.public.id
}

# Security Groups
resource "aws_security_group" "alb_sg" {
  name        = "alb-security-group"
  description = "Security group for ALB"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]  # Replace with specific IP ranges
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name        = "alb-security-group"
    Environment = local.env
  }
}

resource "aws_security_group" "ec2_sg" {
  name        = "ec2-security-group"
  description = "Security group for EC2"
  vpc_id      = aws_vpc.main.id
  ingress {
    from_port = 0
    to_port = 0
    protocol = "-1"
    cidr_blocks = [ "0.0.0.0/0" ]
  }
  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }
  tags = {
    Name        = "ec2-security-group"
    Environment = local.env
  }
}


resource "random_string" "bucket_suffix" {
  length  = 8
  special = false
  upper   = false
}

resource "aws_s3_bucket" "random_bucket" {
  bucket = "my-bucket-${random_string.bucket_suffix.result}"
  acl    = "private"
}


resource "aws_s3_bucket" "env_bucket" {
  bucket = "my-env-bucket-terraform2"
  acl    = "private" # Keep it secure
  depends_on = [ aws_s3_bucket.random_bucket ]
}

resource "aws_s3_bucket_object" "env_file_auth" {
  bucket = aws_s3_bucket.env_bucket.id
  key    = "auth/.env"
  source = "../Excel_Backend/.env"
  acl    = "private"
}

resource "aws_s3_bucket_object" "env_file_ws" {
  bucket = aws_s3_bucket.env_bucket.id
  key    = "ws/.env"
  source = "../Excel_Backend_Nodejs_WS/.env"
  acl    = "private"
}



resource "aws_iam_role" "s3_access_role" {
  name = "s3-env-role"

  assume_role_policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Principal": {
        "Service": "ec2.amazonaws.com"
      },
      "Action": "sts:AssumeRole"
    }
  ]
}
EOF
}


resource "aws_iam_policy" "s3_read_policy" {
  name        = "S3ReadPolicy"
  description = "Allow EC2 to read .env from S3"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Effect": "Allow",
      "Action": ["s3:GetObject"],
      "Resource": "arn:aws:s3:::${aws_s3_bucket.env_bucket.id}/*"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "attach_policy" {
  policy_arn = aws_iam_policy.s3_read_policy.arn
  role       = aws_iam_role.s3_access_role.name
}

resource "aws_iam_instance_profile" "instance_profile" {
  name = "s3-access-profile"
  role = aws_iam_role.s3_access_role.name
}




# Postgres Redis and Elasticsearch
resource "aws_instance" "monitoring" {
  ami                    = "ami-0866a3c8686eaeeba"
  instance_type          = "t3.medium"
  subnet_id              = aws_subnet.public_zone1.id
  associate_public_ip_address = true
  security_groups    = [aws_security_group.ec2_sg.id]

    root_block_device {
      volume_size = 30
      volume_type = "gp3"
    }

  user_data = file("./userdata-tools.sh")

  tags = {
    Name = "Monitoring Server"
  }
}

# #---------------------------------------------ASG-----------------------------------#

# # Launch Template for Node.js Server
resource "aws_launch_template" "nodejs_launch_template" {
  name_prefix   = "nodejs-launch-template"
  image_id      = "ami-0866a3c8686eaeeba"
  instance_type = "t3.medium"
  iam_instance_profile {
    name = aws_iam_instance_profile.instance_profile.name
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.ec2_sg.id]
  }

  block_device_mappings {
    device_name = "/dev/sda1"
    ebs {
      volume_size = 30
      volume_type = "gp3"
    }
  }

  user_data = base64encode(file("./sheetwise-auth-backend.sh"))

  tags = {
    Name        = "NodeJS Launch Template"
    Environment = local.env
  }
}

# # Autoscaling Group for Node.js Server
resource "aws_autoscaling_group" "nodejs_asg" {
  desired_capacity    = 1
  max_size            = 2
  min_size            = 1
  target_group_arns   = [aws_lb_target_group.nodejs_service.arn]
  vpc_zone_identifier = [aws_subnet.public_zone1.id, aws_subnet.public_zone2.id]

  launch_template {
    id      = aws_launch_template.nodejs_launch_template.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "NodeJS ASG"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = local.env
    propagate_at_launch = true
  }

}

# # Launch Template for websocket Server
resource "aws_launch_template" "websocket_launch_template" {
  name_prefix   = "websocket-launch-template"
  image_id      = "ami-0866a3c8686eaeeba"
  instance_type = "t3.medium"
    iam_instance_profile {
    name = aws_iam_instance_profile.instance_profile.name
  }

  network_interfaces {
    associate_public_ip_address = true
    security_groups             = [aws_security_group.ec2_sg.id]
  }

  block_device_mappings {
    device_name = "/dev/sda1"
    ebs {
      volume_size = 30
      volume_type = "gp3"
    }
  }

  user_data = base64encode(file("./sheetwise-ws-backend.sh"))

  tags = {
    Name        = "websocket Launch Template"
    Environment = local.env
  }
}

# # Autoscaling Group for websocket Server
resource "aws_autoscaling_group" "websocket_asg" {
  desired_capacity    = 1
  max_size            = 2
  min_size            = 1
  target_group_arns   = [aws_lb_target_group.websocket_service.arn]
  vpc_zone_identifier = [aws_subnet.public_zone1.id, aws_subnet.public_zone2.id]

  launch_template {
    id      = aws_launch_template.websocket_launch_template.id
    version = "$Latest"
  }

  tag {
    key                 = "Name"
    value               = "websocket ASG"
    propagate_at_launch = true
  }

  tag {
    key                 = "Environment"
    value               = local.env
    propagate_at_launch = true
  }

}


# #--------------------------------------ASG--------------------------------------------#

# # Target Groups
resource "aws_lb_target_group" "websocket_service" {
  name     = "websocket-target-group"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  stickiness {
    enabled = true
    type = "lb_cookie"
  }
  tags = {
    Name        = "websocket-target-group"
    Environment = local.env
  }
}

resource "aws_lb_target_group" "nodejs_service" {
  name     = "nodejs-target-group"
  port     = 80
  protocol = "HTTP"
  vpc_id   = aws_vpc.main.id
  tags = {
    Name        = "nodejs-target-group"
    Environment = local.env
  }
}


# # CloudWatch Alarms and Scaling Policies for Node.js ASG

resource "aws_cloudwatch_metric_alarm" "nodejs_cpu_high" {
  alarm_name          = "nodejs-high-cpu-utilization"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "50"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.nodejs_asg.name
  }

  alarm_description = "This metric monitors nodejs ec2 cpu utilization"
  alarm_actions     = [aws_autoscaling_policy.nodejs_scale_up.arn]
}

resource "aws_cloudwatch_metric_alarm" "nodejs_cpu_low" {
  alarm_name          = "nodejs-low-cpu-utilization"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.nodejs_asg.name
  }

  alarm_description = "This metric monitors nodejs ec2 cpu utilization"
  alarm_actions     = [aws_autoscaling_policy.nodejs_scale_down.arn]
}

resource "aws_autoscaling_policy" "nodejs_scale_up" {
  name                   = "nodejs-scale-up-policy"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.nodejs_asg.name
}

resource "aws_autoscaling_policy" "nodejs_scale_down" {
  name                   = "nodejs-scale-down-policy"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.nodejs_asg.name
}

# CloudWatch Alarms and Scaling Policies for websocket ASG
resource "aws_cloudwatch_metric_alarm" "websocket_cpu_high" {
  alarm_name          = "websocket-high-cpu-utilization"
  comparison_operator = "GreaterThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "50"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.websocket_asg.name
  }

  alarm_description = "This metric monitors websocket ec2 cpu utilization"
  alarm_actions     = [aws_autoscaling_policy.websocket_scale_up.arn]
}

resource "aws_cloudwatch_metric_alarm" "websocket_cpu_low" {
  alarm_name          = "websocket-low-cpu-utilization"
  comparison_operator = "LessThanOrEqualToThreshold"
  evaluation_periods  = "2"
  metric_name         = "CPUUtilization"
  namespace           = "AWS/EC2"
  period              = "120"
  statistic           = "Average"
  threshold           = "20"

  dimensions = {
    AutoScalingGroupName = aws_autoscaling_group.websocket_asg.name
  }

  alarm_description = "This metric monitors websocket ec2 cpu utilization"
  alarm_actions     = [aws_autoscaling_policy.websocket_scale_down.arn]
}

resource "aws_autoscaling_policy" "websocket_scale_up" {
  name                   = "websocket-scale-up-policy"
  scaling_adjustment     = 1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.websocket_asg.name
}

resource "aws_autoscaling_policy" "websocket_scale_down" {
  name                   = "websocket-scale-down-policy"
  scaling_adjustment     = -1
  adjustment_type        = "ChangeInCapacity"
  cooldown               = 300
  autoscaling_group_name = aws_autoscaling_group.websocket_asg.name
}




# # Application Load Balancer
resource "aws_lb" "nodejs-lb" {
  name               = "nodejs-load-balancer"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_zone1.id, aws_subnet.public_zone2.id]

  tags = {
    Name        = "nodejs-load-balancer"
    Environment = local.env
  }
}


resource "aws_lb" "websocket-lb" {
  name               = "websocket-load-balancer"
  internal           = false
  load_balancer_type = "application"
  security_groups    = [aws_security_group.alb_sg.id]
  subnets            = [aws_subnet.public_zone1.id, aws_subnet.public_zone2.id]
  client_keep_alive = 3600
  tags = {
    Name        = "websocket-load-balancer"
    Environment = local.env
  }
}

resource "aws_lb_listener" "http" {
  load_balancer_arn = aws_lb.nodejs-lb.arn
  port              = 80
  protocol          = "HTTP"
  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.nodejs_service.arn
  }
}

resource "aws_lb_listener" "websocket-listener" {
  load_balancer_arn = aws_lb.websocket-lb.arn
  port              = 80
  protocol          = "HTTP"

  default_action {
    type             = "forward"
    target_group_arn = aws_lb_target_group.websocket_service.arn
  }
}

# Postgres Redis ElasticSearch
resource "aws_route53_zone" "backend_redis" {
  name          = "backend.tools.com"
  vpc {
    vpc_id = aws_vpc.main.id
  }
}

output "monitoring_instance_public_ip" {
  value       = aws_instance.monitoring.public_ip
  description = "The public IP of the monitoring instance"
}

resource "aws_route53_record" "backend_redis_record" {
  zone_id = aws_route53_zone.backend_redis.zone_id
  name    = "backend.tools.com"
  type    = "A"
  ttl     = 300
  records = [aws_instance.monitoring.public_ip]
}



resource "aws_cloudwatch_dashboard" "infrastructure_dashboard" {
  dashboard_name = "${local.env}-advanced-infrastructure-dashboard"

  dashboard_body = jsonencode({
    widgets = [
      // EC2 Metrics - Node.js ASG
      {
        type   = "metric",
        x      = 0,
        y      = 0,
        width  = 12,
        height = 6,
        properties = {
          metrics = [
            ["AWS/EC2",
             "CPUUtilization",
              "AutoScalingGroupName", 
              "${aws_autoscaling_group.nodejs_asg.id}"],
            [".", "NetworkIn", ".", "."],
            [".", "NetworkOut", ".", "."],
            [".", "DiskReadOps", ".", "."],
            [".", "DiskWriteOps", ".", "."],
            [".", "StatusCheckFailed", ".", "."]
          ],
          view    = "timeSeries",
          stacked = false,
          region  = "${local.region}",
          title   = "Node.js Server - Detailed Metrics",
          period  = 300
        }
      },
      
      // EC2 Metrics - websocket ASG
      {
        type   = "metric",
        x      = 12,
        y      = 0,
        width  = 12,
        height = 6,
        properties = {
          metrics = [
            ["AWS/EC2", "CPUUtilization", "AutoScalingGroupName", "${aws_autoscaling_group.websocket_asg.name}"],
            [".", "NetworkIn", ".", "."],
            [".", "NetworkOut", ".", "."],
            [".", "DiskReadOps", ".", "."],
            [".", "DiskWriteOps", ".", "."],
            [".", "StatusCheckFailed", ".", "."]
          ],
          view    = "timeSeries",
          stacked = false,
          region  = "${local.region}",
          title   = "websocket Server - Detailed Metrics",
          period  = 300
        }
      },

      
      
      // Load Balancer Metrics - Node.js
      {
        type   = "metric",
        x      = 12,
        y      = 6,
        width  = 12,
        height = 6,
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${aws_lb.nodejs-lb.arn}"],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."],
            [".", "HealthyHostCount", ".", "."],
            [".", "UnHealthyHostCount", ".", "."],
            [".", "ActiveConnectionCount", ".", "."],
            [".", "ProcessedBytes", ".", "."]
          ],
          view    = "timeSeries",
          stacked = false,
          region  = "${local.region}",
          title   = "Node.js Load Balancer - Detailed Metrics",
          period  = 300
        }
      },
      
      // Load Balancer Metrics - websocket
      {
        type   = "metric",
        x      = 0,
        y      = 12,
        width  = 12,
        height = 6,
        properties = {
          metrics = [
            ["AWS/ApplicationELB", "RequestCount", "LoadBalancer", "${aws_lb.websocket-lb.arn}"],
            [".", "TargetResponseTime", ".", "."],
            [".", "HTTPCode_Target_4XX_Count", ".", "."],
            [".", "HTTPCode_Target_5XX_Count", ".", "."],
            [".", "HealthyHostCount", ".", "."],
            [".", "UnHealthyHostCount", ".", "."],
            [".", "ActiveConnectionCount", ".", "."],
            [".", "ProcessedBytes", ".", "."]
          ],
          view    = "timeSeries",
          stacked = false,
          region  = "${local.region}",
          title   = "websocket Load Balancer - Detailed Metrics",
          period  = 300
        }
      },
      
      // Auto Scaling Group Metrics
      {
        type   = "metric",
        x      = 12,
        y      = 12,
        width  = 12,
        height = 6,
        properties = {
          metrics = [
            ["AWS/AutoScaling", "GroupTotalInstances", "AutoScalingGroupName", "${aws_autoscaling_group.nodejs_asg.name}"],
            [".", "GroupInServiceInstances", ".", "."],
            [".", "GroupPendingInstances", ".", "."],
            [".", "GroupTerminatingInstances", ".", "."],
            [".", "GroupTotalInstances", "AutoScalingGroupName", "${aws_autoscaling_group.websocket_asg.name}"],
            [".", "GroupInServiceInstances", ".", "."],
            [".", "GroupPendingInstances", ".", "."],
            [".", "GroupTerminatingInstances", ".", "."]
          ],
          view    = "timeSeries",
          stacked = false,
          region  = "${local.region}",
          title   = "Auto Scaling Group - Comprehensive Metrics",
          period  = 300
        }
      },
      
      
      // Network Metrics
      {
        type   = "metric",
        x      = 12,
        y      = 18,
        width  = 12,
        height = 6,
        properties = {
          metrics = [
            ["AWS/VPC", "ActiveConnections", "VpcId", "${aws_vpc.main.id}"],
            [".", "PacketsIn", ".", "."],
            [".", "PacketsOut", ".", "."],
            ["AWS/NATGateway", "BytesOut", "NatGatewayId", "${aws_nat_gateway.nat.id}"],
            [".", "BytesIn", ".", "."],
            [".", "PacketsOut", ".", "."]
          ],
          view    = "timeSeries",
          stacked = false,
          region  = "${local.region}",
          title   = "Network & NAT Gateway Metrics",
          period  = 300
        }
      }
    ]
  })
}

# Output the dashboard name
output "cloudwatch_dashboard_name" {
  value       = aws_cloudwatch_dashboard.infrastructure_dashboard.dashboard_arn
  description = "Name of the created advanced CloudWatch dashboard"
}


# # 1. Create HTTP API Gateway
resource "aws_apigatewayv2_api" "http_api" {
  name          = "http-api-gateway"
  protocol_type = "HTTP"
  cors_configuration {
    allow_credentials = true
    allow_headers = [ "authorization","Content-Type" ]
    max_age = 300
    allow_methods = [ "PUT","GET","POST","DELETE","OPTIONS","HEAD","PATCH" ]
    allow_origins = [ "https://www.sujalsharma.in","https://sujalsharma.in" ]
  }
}

# # 2. Create Integration with Load Balancer
resource "aws_apigatewayv2_integration" "http_integration" {
  api_id           = aws_apigatewayv2_api.http_api.id
  integration_type = "HTTP_PROXY"
  integration_method = "ANY"
  integration_uri   = "http://${aws_lb.nodejs-lb.dns_name}/{proxy}"  # Replace with your ALB URL
  payload_format_version = "1.0"
}

# # 3. Create Route with `{proxy+}` to allow dynamic routing
resource "aws_apigatewayv2_route" "proxy_route" {
  api_id    = aws_apigatewayv2_api.http_api.id
  route_key = "ANY /{proxy+}"
  target    = "integrations/${aws_apigatewayv2_integration.http_integration.id}"
}

# # 4. Create API Deployment
resource "aws_apigatewayv2_stage" "http_stage" {
  api_id      = aws_apigatewayv2_api.http_api.id
  name        = "dev"
  auto_deploy = true  # Automatically deploy new changes
}

output "api_gateway_backend_url" {
  value = "${aws_apigatewayv2_api.http_api.api_endpoint}/${aws_apigatewayv2_stage.http_stage.name}"
  depends_on = [ aws_apigatewayv2_api.http_api ]
}

resource "aws_s3_bucket" "sujal910992" {
  bucket = "sujal910"
  depends_on = [ aws_s3_bucket.random_bucket ]
}

resource "aws_s3_bucket_cors_configuration" "sujal910992_cors" {
  bucket = aws_s3_bucket.sujal910992.id

  cors_rule {
    allowed_headers = ["*"]
    allowed_methods = ["GET", "PUT", "POST"]
    allowed_origins = ["https://sujalsharma.in"]
    expose_headers  = ["ETag"]
  }
}


# output "ip_address" {
#   value = aws_instance.kafka-postgres-redis.public_ip
# }





# CloudFront Distribution
resource "aws_cloudfront_distribution" "cdn" {
  origin {
    domain_name = aws_lb.websocket-lb.dns_name
     origin_id   = "WebSocketALB"
    custom_origin_config {
      http_port              = 80
      https_port             = 443
      origin_protocol_policy = "http-only"
      origin_ssl_protocols   = ["TLSv1.2"]

      # Add custom headers to allow CORS from origin
      origin_read_timeout    = 60
      origin_keepalive_timeout = 60
    }

  }

  enabled = true
  
  default_cache_behavior {
    target_origin_id = "WebSocketALB"  # Was "NodeJSALB"
    viewer_protocol_policy = "redirect-to-https"
    
    # Allow all HTTP methods
    allowed_methods  = ["DELETE", "GET", "HEAD", "OPTIONS", "PATCH", "POST", "PUT"]
    cached_methods   = ["GET", "HEAD", "OPTIONS"]
    
    # Min TTL of 0 to ensure OPTIONS requests aren't cached too long
    min_ttl          = 0
    default_ttl      = 3600
    max_ttl          = 86400
    
    forwarded_values {
      query_string = true
      headers      = ["Origin", "Access-Control-Request-Headers", "Access-Control-Request-Method"]
      
      cookies {
        forward = "none"
      }
    }
    

  }

  restrictions {
    geo_restriction {
      restriction_type = "none"
    }
  }

  viewer_certificate {
    cloudfront_default_certificate = true
  }

  depends_on = [aws_lb.websocket-lb]
}

output "aws_cloudfront_distribution" {
  value = "https://${aws_cloudfront_distribution.cdn.domain_name}"
  description = "The domain name of cloudfront"
  depends_on = [aws_cloudfront_distribution.cdn]
}