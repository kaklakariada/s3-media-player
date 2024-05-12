import { DynamoDBClient, DynamoDBClientConfig, ScanCommandOutput, Select } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument, DynamoDBDocumentClient, PutCommandInput, ScanCommandInput } from "@aws-sdk/lib-dynamodb";
import environment from "../environment";
import { AuthService, RenewableCredentials } from "./AuthService";


interface State {
    client: DynamoDBClient;
    docClient: DynamoDBDocumentClient;
    doc: DynamoDBDocument;
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
        const doc = (await this.getState()).doc;
        const command: ScanCommandInput = {
            ProjectionExpression: undefined,
            ExpressionAttributeNames: { "#key": "key" },
            ExpressionAttributeValues: { ":v0": prefix },
            FilterExpression: "begins_with(#key, :v0)",
            Limit: 100,
            Select: Select.ALL_ATTRIBUTES,
            TableName: environment.metadataTableName,
        };
        const response: ScanCommandOutput = await doc.scan(command);
        console.log(`Query for ${prefix} returned ${response.Count} items, ${response.ScannedCount} scanned, last evaluated key: ${response.LastEvaluatedKey}`);
        return response.Items ? response.Items : [];
    }

    async insert(item: Record<string, any>) {
        const args: PutCommandInput = { TableName: environment.metadataTableName, Item: item };
        const doc = (await this.getState()).doc;
        const result = await doc.put(args);
        console.log("Put result", result);
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
        const doc = DynamoDBDocument.from(client);
        return { client, docClient, doc, credentials };
    }
}
