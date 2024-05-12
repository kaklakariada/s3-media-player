import { DynamoDBClient, DynamoDBClientConfig, ScanCommand, Select } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocumentClient, ScanCommandOutput } from "@aws-sdk/lib-dynamodb";
import environment from "../environment";
import { AuthService, RenewableCredentials } from "./AuthService";


interface State {
    client: DynamoDBClient;
    docClient: DynamoDBDocumentClient;
    credentials: RenewableCredentials;
}

export interface RawDynamoDbResult {

}

export class AuthDynamoDbClient {
    private state: State | undefined;

    constructor(private authService: AuthService) {
        this.state = undefined
    }

    async query(prefix: string): Promise<Record<string, any>[]> {
        const command = new ScanCommand({
            ProjectionExpression: undefined,
            ExpressionAttributeNames: { "#path": "path" },
            ExpressionAttributeValues: { ":v0": { "S": prefix } },
            FilterExpression: "begins_with(#path, :v0)",
            Limit: 100,
            Select: Select.ALL_ATTRIBUTES,
            TableName: environment.metadataTableName,
        });
        const response: ScanCommandOutput = await (await this.getState()).docClient.send(command);
        console.log(`Query for ${prefix} returned ${response.Count} items, ${response.ScannedCount} scanned, last evaluated key: ${response.LastEvaluatedKey}`);
        return response.Items ? response.Items : [];
    }

    private async getClient(): Promise<DynamoDBClient> {
        return (await this.getState()).client;
    }

    private async getState(): Promise<State> {
        if (!this.state) {
            const credentials = await this.authService.getRenewableCredentials();
            this.state = await this.createState(credentials);
            credentials.whenExpired(async (newCredentials) => {
                console.log("Creating new DynamoDb client with new credentials");
                this.state = await this.createState(newCredentials)
            })
        }
        return this.state;
    }

    private async createState(credentials: RenewableCredentials): Promise<State> {
        const config: DynamoDBClientConfig = {
            region: environment.region,
            credentials: credentials.credentials
        };
        const client = new DynamoDBClient(config);
        const docClient = DynamoDBDocumentClient.from(client);

        return { client, docClient, credentials };
    }
}
