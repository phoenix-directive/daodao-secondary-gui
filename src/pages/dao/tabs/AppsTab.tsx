import { AppPicker, DappComponent } from '@/components/custom/apps';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useDaoDaoState } from '@/hooks/useDaoDao';
import { Loader2 } from 'lucide-react';
import { useState } from 'react';
import { useParams } from 'react-router-dom';

export function AppsTab() {
  const [fullScreen, setFullScreen] = useState(false);
  const [url, setUrl] = useState('');
  const [name, setName] = useState('');

  const { address: daoAddress } = useParams<{ address: string }>();
  const daoState = useDaoDaoState(daoAddress);
  const daoData = daoState.data.value ?? undefined;

  if (daoState.loading.value || !daoData) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Apps</CardTitle>
        </CardHeader>
        <CardContent className="p-8">
          <div className="flex flex-col items-center justify-center py-12">
            <Loader2 className="h-8 w-8 animate-spin text-primary mb-4" />
            <p className="text-sm text-muted-foreground">Loading apps...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="flex-0 mb-6">
        <CardHeader>
          <CardTitle>Apps</CardTitle>
        </CardHeader>
        <CardContent>
          {/* <AppRenderer
            fullScreen={fullScreen}
            onFullScreenChange={setFullScreen}
            daoData={daoData}
          /> */}

          <AppPicker
            url={url}
            onOpenApp={(newUrl, name) => {
              console.log('🚀 ~ AppsTab ~ newUrl:', newUrl);
              setUrl(newUrl);
              setName(name);
            }}
            daoData={daoData}
          />
        </CardContent>
      </Card>

      {url && (
        <DappComponent
          className="w-full h-full min-h-300 flex-1"
          src={url}
          name={name ?? url}
          daoData={daoData}
        />
      )}
    </>
  );
}
