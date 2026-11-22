
# Find the latest Ubuntu 22.04 LTS AMI
data "aws_ami" "ubuntu" {
  most_recent = true
  owners      = ["099720109477"]

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# 1. Control Node - Ansible and Vault
resource "aws_instance" "control_node" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.control_sg.id]
  key_name                    = aws_key_pair.project_key.key_name
  associate_public_ip_address = true

  root_block_device {
    volume_size           = 12
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_tokens = "required"
  }

  tags = {
    Name        = "${var.project_name}-control"
    Environment = var.environment
    Role        = "Control-Node"
  }
}

# 2. Application Server - Node.js, Nginx, Redis, Puppet
resource "aws_instance" "app_server" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.app_sg.id]
  key_name                    = aws_key_pair.project_key.key_name
  associate_public_ip_address = true

  root_block_device {
    volume_size           = 12
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_tokens = "required"
  }

  tags = {
    Name        = "${var.project_name}-app"
    Environment = var.environment
    Role        = "Application-Server"
  }
}

# 3. Monitoring Server - Nagios
resource "aws_instance" "monitor_server" {
  ami                         = data.aws_ami.ubuntu.id
  instance_type               = var.instance_type
  subnet_id                   = aws_subnet.public.id
  vpc_security_group_ids      = [aws_security_group.monitor_sg.id]
  key_name                    = aws_key_pair.project_key.key_name
  associate_public_ip_address = true

  root_block_device {
    volume_size           = 12
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  metadata_options {
    http_tokens = "required"
  }

  tags = {
    Name        = "${var.project_name}-monitor"
    Environment = var.environment
    Role        = "Monitoring-Server"
  }
}
