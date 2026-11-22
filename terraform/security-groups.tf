
# ==========================================
# CONTROL NODE SECURITY GROUP
# ==========================================

resource "aws_security_group" "control_sg" {
  name        = "${var.project_name}-control-sg"
  description = "Security group for Ansible Control Node"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from administrator laptop"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-control-sg"
  }
}


# ==========================================
# APP SERVER SECURITY GROUP
# ==========================================

resource "aws_security_group" "app_sg" {
  name        = "${var.project_name}-app-sg"
  description = "Security group for Application Server"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "HTTP application traffic"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description = "HTTPS application traffic"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = ["0.0.0.0/0"]
  }

  ingress {
    description     = "SSH from Control Node"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.control_sg.id]
  }

  ingress {
    description     = "NRPE monitoring from Nagios"
    from_port       = 5666
    to_port         = 5666
    protocol        = "tcp"
    security_groups = [aws_security_group.monitor_sg.id]
  }

  ingress {
    description     = "Allow ICMP ping from Monitor Server"
    from_port       = 8
    to_port         = -1
    protocol        = "icmp"
    security_groups = [aws_security_group.monitor_sg.id]
  }

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-app-sg"
  }
}


# ==========================================
# MONITOR SERVER SECURITY GROUP
# ==========================================

resource "aws_security_group" "monitor_sg" {
  name        = "${var.project_name}-monitor-sg"
  description = "Security group for Nagios Monitor Server"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from Control Node"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    security_groups = [
      aws_security_group.control_sg.id
    ]
  }

  ingress {
    description = "Nagios Web Interface"
    from_port   = 80
    to_port     = 80
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  ingress {
    description = "Nagios HTTPS Interface"
    from_port   = 443
    to_port     = 443
    protocol    = "tcp"
    cidr_blocks = [var.my_ip]
  }

  egress {
    description = "Allow outbound traffic"
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = {
    Name = "${var.project_name}-monitor-sg"
  }
}
