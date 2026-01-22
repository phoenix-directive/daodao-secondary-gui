import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Card, CardContent } from '@/components/ui/card';
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from '@/components/ui/empty';
import { notEmpty, notFalsy } from '@/hooks/helpers/helpers';
import { AlertCircleIcon } from 'lucide-react';
import { motion } from 'motion/react';

export const ErrorDisplay = ({
  errors,
  title,
}: {
  errors: (string | null | false | undefined)[] | undefined;
  title?: string;
}) => {
  if(!errors) {
    return null;
  }
  const allErrors = errors.filter(notFalsy);
  return (
    allErrors.length > 0 && (
      <motion.div
        initial={{ height: 0 }}
        animate={{ height: 'auto' }}
        exit={{ height: 0 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ overflow: 'hidden' }}
      >
        <Alert variant="destructive">
          <AlertCircleIcon />
          <AlertTitle>{title || 'Error during loading'}</AlertTitle>
          <AlertDescription>{allErrors.join(', ')}</AlertDescription>
        </Alert>
      </motion.div>
    )
  );
};

export const ErrorDisplayEmpty = ({
  errors,
  title,
}: {
  errors: (string | null)[];
  title?: string;
}) => {
  const allErrors = errors.filter(notEmpty);

  return (
    allErrors.length > 0 && (
      <Card>
        <CardContent>
          <Empty>
            <EmptyHeader>
              <EmptyMedia variant="icon-destructive">
                <AlertCircleIcon />
              </EmptyMedia>
              <EmptyTitle>{title || 'Error during loading'}</EmptyTitle>
              <EmptyDescription>{allErrors.join(', ')}</EmptyDescription>
            </EmptyHeader>
          </Empty>
        </CardContent>
      </Card>
    )
  );
};

// eslint-disable-next-line react-refresh/only-export-components
export const renderErrorDisplay = (
  errors: (string | null | undefined)[],
  options?: { title: string; small?: boolean },
) => {
  const allErrors = errors.filter(notFalsy);

  if (allErrors.length === 0) {
    return null;
  }

  if (options?.small) {
    return <ErrorDisplay errors={allErrors} title={options?.title} />;
  }

  return <ErrorDisplayEmpty errors={allErrors} title={options?.title} />;
};
