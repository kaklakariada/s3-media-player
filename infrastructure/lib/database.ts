import { CfnOutput, RemovalPolicy } from "aws-cdk-lib";
import { AttributeType, BillingMode, Table, TableClass, TableEncryption } from "aws-cdk-lib/aws-dynamodb";
import { Construct } from "constructs";

interface DatabaseProps {

}


export class DatabaseConstruct extends Construct {
    private readonly favoritesTable: Table;
    constructor(scope: Construct, id: string, _props: DatabaseProps) {
        super(scope, id);
        this.favoritesTable = new Table(this, 'Favorites', {
            partitionKey: {
                name: 'path',
                type: AttributeType.STRING
            },
            billingMode: BillingMode.PAY_PER_REQUEST,
            removalPolicy: RemovalPolicy.RETAIN_ON_UPDATE_OR_DELETE,
            pointInTimeRecovery: true,
            tableClass: TableClass.STANDARD,
            deletionProtection: true,
            encryption: TableEncryption.DEFAULT,
        });

        new CfnOutput(this, "FavoritesTableName", {
            description: "Favorites DynamoDb Table Name",
            value: this.table.tableName
        });
    }

    get table() {
        return this.favoritesTable;
    }
}
