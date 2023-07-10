variable "application_config" {
  type        = map(string)
  description = "Lambda environment variables, that will be stored in SSM Parameter Store"
  default     = {}
}

variable "environment" {
  type        = string
  description = "The environment of the application [dev, staging, prod]"
}

variable "lambda_s3_key" {
  type        = string
  description = "The lambda s3 key"
}
