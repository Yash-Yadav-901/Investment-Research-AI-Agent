
output "vpc_id" {
  value = aws_vpc.main.id
}

output "public_subnet_id" {
  value = aws_subnet.public.id
}

output "internet_gateway_id" {
  value = aws_internet_gateway.igw.id
}


output "control_node_public_ip" {
  description = "Public IP of the Control Node"
  value       = aws_instance.control_node.public_ip
}

output "app_server_public_ip" {
  description = "Public IP of the Application Server"
  value       = aws_instance.app_server.public_ip
}

output "monitor_server_public_ip" {
  description = "Public IP of the Monitoring Server"
  value       = aws_instance.monitor_server.public_ip
}

output "control_node_private_ip" {
  value = aws_instance.control_node.private_ip
}

output "app_server_private_ip" {
  value = aws_instance.app_server.private_ip
}

output "monitor_server_private_ip" {
  value = aws_instance.monitor_server.private_ip
}
