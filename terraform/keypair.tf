resource "aws_key_pair" "project_key" {
  key_name   = "investment-research-key"
  public_key = file("C:/Users/kuamr/.ssh/investment-research-key.pub")
}