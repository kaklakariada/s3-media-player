import React, { useEffect, useState } from "react";
import Container from "@material-ui/core/Container";
import CircularProgress from "@material-ui/core/CircularProgress";
import { S3Service } from "../services/S3Service";

const s3 = new S3Service();

const S3BucketList: React.FC = () => {
    const [buckets, setBuckets] = useState<string[] | undefined>(undefined);

    async function fetchData() {
        const buckets = await s3.listBuckets();
        setBuckets(buckets);
    }
    useEffect(() => { fetchData(); }, []);
    return (
        <Container>
            <div>
                {(buckets === undefined)
                    ? <CircularProgress />
                    : buckets.map((bucket) => <div>{bucket}</div>)}
            </div>
        </Container>
    );
};

export default S3BucketList;
