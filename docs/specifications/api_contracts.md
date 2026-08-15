# API CONTRACTS (OPENAPI 3.0)
## Personal Wealth Management endpoints
**Version:** 1.0.0  
**Status:** Approved  
**Author:** Principal Integration Engineer  
**Date:** June 2026  

---

## 1. OpenAPI Specification

```yaml
openapi: 3.0.3
info:
  title: Weallth - Personal Wealth Management API
  version: 1.0.0
  description: |
    Core APIs for managing user goals, calculating net worth trends, retrieving Wealth Health Scores, 
    and fetching rule-based recommendations.
    
    CRITICAL DISCLAIMER: This API is ADVISORY ONLY. It does not interface with order routes, 
    hold customer capital, or execute securities trades.
servers:
  - url: https://api.weallth.com/v1
    description: Production API Gateway
paths:

  /users/{user_id}/wealth-health-score:
    get:
      summary: Retrieve a user's latest Wealth Health Score snapshot
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: Latest Wealth Health Score successfully retrieved
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/WealthHealthScoreResponse'
        '401':
          $ref: '#/components/responses/401Unauthorized'
        '403':
          $ref: '#/components/responses/403Forbidden'
        '404':
          description: User score not found

  /users/{user_id}/net-worth:
    get:
      summary: Fetch user's net worth trend over time
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: period
          in: query
          required: false
          schema:
            type: string
            enum: [1M, 3M, YTD, 1Y, 3Y, 5Y, ALL]
            default: 1Y
      responses:
        '200':
          description: Net worth history payload
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/NetWorthResponse'
        '401':
          $ref: '#/components/responses/401Unauthorized'

  /users/{user_id}/goals:
    get:
      summary: List all active financial goals for a user
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: List of goals with projected shortfalls
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/Goal'
    post:
      summary: Create a new financial goal
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GoalCreateRequest'
      responses:
        '201':
          description: Goal successfully created and inflation-adjusted future cost calculated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Goal'
        '400':
          $ref: '#/components/responses/400BadRequest'

  /users/{user_id}/goals/{goal_id}:
    put:
      summary: Update a financial goal's parameters
      description: |
        Adherence constraint: Gaps must only be solved by modifying three user-controlled variables:
        Goal Cost, Monthly Savings, and Target Timeline. Changing return rates/inflation rates is restricted.
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: goal_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/GoalUpdateRequest'
      responses:
        '200':
          description: Goal successfully updated and recalculated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/Goal'
        '400':
          $ref: '#/components/responses/400BadRequest'
    delete:
      summary: Remove a financial goal
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: goal_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '204':
          description: Goal successfully deleted (soft delete)

  /users/{user_id}/recommendations:
    get:
      summary: List actionable wealth management recommendations for a user
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      responses:
        '200':
          description: List of recommendation alerts
          content:
            application/json:
              schema:
                type: array
                items:
                  $ref: '#/components/schemas/RecommendationAlert'

  /users/{user_id}/recommendations/{recommendation_id}:
    patch:
      summary: Update the status of a recommendation alert (Snooze/Dismiss)
      parameters:
        - name: user_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
        - name: recommendation_id
          in: path
          required: true
          schema:
            type: string
            format: uuid
      requestBody:
        required: true
        content:
          application/json:
            schema:
              type: object
              required:
                - status
              properties:
                status:
                  type: string
                  enum: [Active, Dismissed, Snoozed, Addressed]
      responses:
        '200':
          description: Recommendation status updated
          content:
            application/json:
              schema:
                $ref: '#/components/schemas/RecommendationAlert'

  /advisor/compliance-logs:
    post:
      summary: Log an advisor action and suitability justification for compliance audit
      requestBody:
        required: true
        content:
          application/json:
            schema:
              $ref: '#/components/schemas/ComplianceLogRequest'
      responses:
        '201':
          description: Compliance log successfully written and locked

components:
  responses:
    400BadRequest:
      description: Invalid request parameters or validation constraint violation
      content:
        application/json:
          schema:
            $ref: '#/components/schemas/ErrorResponse'
    401Unauthorized:
      description: Authentication failed or missing bearer token
    403Forbidden:
      description: Access denied (e.g. advisor lacks client consent mapping)

  schemas:
    ErrorResponse:
      type: object
      properties:
        error_code:
          type: string
          example: "INVALID_GOAL_INPUT"
        message:
          type: string
          example: "Goal cost modifications must be positive decimal numbers."
        details:
          type: array
          items:
            type: string
            example: "current_cost must be >= 0"

    WealthHealthScoreResponse:
      type: object
      properties:
        user_id:
          type: string
          format: uuid
        score:
          type: integer
          minimum: 0
          maximum: 100
        category:
          type: string
          enum: [VULNERABLE, CAUTION, HEALTHY, EXCELLENT]
        updated_at:
          type: string
          format: date-time
        disclaimer:
          type: string
          example: "Advisory simulation only. Recommendations are not trading orders."

    NetWorthResponse:
      type: object
      properties:
        user_id:
          type: string
          format: uuid
        current_net_worth:
          type: number
        assets_total:
          type: number
        liabilities_total:
          type: number
        history:
          type: array
          items:
            type: object
            properties:
              date:
                type: string
                format: date
              net_worth:
                type: number

    Goal:
      type: object
      properties:
        id:
          type: string
          format: uuid
        user_id:
          type: string
          format: uuid
        name:
          type: string
        category:
          type: string
        current_cost:
          type: number
        target_date:
          type: string
          format: date
        earmarked_assets:
          type: number
        monthly_savings:
          type: number
        outside_sources:
          type: number
        future_cost:
          type: number
        shortfall:
          type: number
        updated_at:
          type: string
          format: date-time

    GoalCreateRequest:
      type: object
      required:
        - name
        - category
        - current_cost
        - target_date
      properties:
        name:
          type: string
          maxLength: 100
        category:
          type: string
          enum: [Retirement, Education, Purchase, Travel, Philanthropy, General Savings]
        current_cost:
          type: number
          minimum: 0.00
        target_date:
          type: string
          format: date
        earmarked_assets:
          type: number
          minimum: 0.00
          default: 0.00
        monthly_savings:
          type: number
          minimum: 0.00
          default: 0.00
        outside_sources:
          type: number
          minimum: 0.00
          default: 0.00

    GoalUpdateRequest:
      type: object
      description: |
        Advisory engine validation: Update requests containing modifications to return_rate or inflation_rate 
        will be rejected with a 400 Bad Request to maintain Edelman control methodology constraints.
      properties:
        name:
          type: string
        current_cost:
          type: number
          minimum: 0.00
        target_date:
          type: string
          format: date
        earmarked_assets:
          type: number
          minimum: 0.00
        monthly_savings:
          type: number
          minimum: 0.00
        outside_sources:
          type: number
          minimum: 0.00

    RecommendationAlert:
      type: object
      properties:
        id:
          type: string
          format: uuid
        user_id:
          type: string
          format: uuid
        category:
          type: string
        priority:
          type: string
          enum: [Low, Medium, High, Critical]
        alert_message:
          type: string
        formula_triggered:
          type: string
        status:
          type: string
          enum: [Active, Dismissed, Snoozed, Addressed]

    ComplianceLogRequest:
      type: object
      required:
        - user_id
        - advisor_id
        - action_type
        - suitability_rationale
        - ip_address
      properties:
        user_id:
          type: string
          format: uuid
        advisor_id:
          type: string
          format: uuid
        action_type:
          type: string
        suitability_rationale:
          type: string
          minLength: 10
        ip_address:
          type: string
```
