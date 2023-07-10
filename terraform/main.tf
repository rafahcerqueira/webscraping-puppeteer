locals {
  region         = "us-east-1"
  lambda_name    = "example"
  workspace_name = "procurando-info"
}

provider "aws" {
  region = local.region
}

terraform {
  cloud {
    organization = "ayn"

    workspaces {
      name = "example"
    }
  }
}

data "aws_caller_identity" "current" {}

module "policy" {
  source = "git::https://github.com/cleitinif/common-infra.git//modules/procurando-info/iam?ref=develop"

  policy = {
    name        = "${local.workspace_name}${local.lambda_name}-policy"
    description = "Policy for ${local.lambda_name} lambda function"
    json = jsonencode({
      Version = "2012-10-17"
      Statement = [
        {
          Sid    = ""
          Action = ["secretsmanager:GetSecretValue"]
          Effect = "Allow"
          Resource = [
            "arn:aws:secretsmanager:${local.region}:${data.aws_caller_identity.current.account_id}:secret:/example/${var.environment}/*",
          ]
        },
        {
          Sid    = ""
          Action = ["ssm:GetParameter"]
          Effect = "Allow"
          Resource = [
            "arn:aws:ssm:${local.region}:${data.aws_caller_identity.current.account_id}:parameter/example/${var.environment}/*",
            "arn:aws:ssm:${local.region}:${data.aws_caller_identity.current.account_id}:parameter/procurando-info/${var.environment}/database-credentials"
          ]
        }
      ]
    })
  }
}

module "execution-role" {
  source = "git::https://github.com/cleitinif/common-infra.git//modules/procurando-info/iam?ref=develop"

  role = {
    name = "${local.workspace_name}-${local.lambda_name}-execution-role"
    assume_role_policy = jsonencode({
      Version = "2012-10-17"
      Statement = [{
        Action = ["sts:AssumeRole"]
        Effect = "Allow"
        Sid    = ""
        Principal = {
          Service = "lambda.amazonaws.com"
        }
        }
      ]
    })
    policies_arns = [
      module.policy.policy_arn[0],
      "arn:aws:iam::aws:policy/service-role/AWSLambdaBasicExecutionRole"
    ]
  }
}

module "lambda" {
  source = "git::https://github.com/cleitinif/common-infra.git//modules/procurando-info/lambda?ref=develop"

  name               = "example"
  execution_role_arn = module.execution-role.role_arn[0]
  handler            = "main.handler"
  runtime            = "nodejs18.x"
  env_vars = merge({
    NODE_ENV = "production"
  }, var.application_config)

  lambda_s3_bucket = "procurando-info-artifacts"
  lambda_s3_key    = var.lambda_s3_key
}

